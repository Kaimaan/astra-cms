'use client';

/**
 * Chat Panel
 *
 * Chat-based interface for editing blocks via natural language.
 * Users describe changes, AI proposes diffs, user accepts or rejects.
 * Supports all block types dynamically via the block registry.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useEditMode } from './EditModeProvider';
import { PageSettingsPanel } from './PageSettingsPanel';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import type { ChatMessage, BlockConversation, BlockMetadata } from './chat-types';
import { generateMessageId, computePropDiffs } from './chat-utils';
import type { EditableField } from '@/lib/schema/schema-to-fields';

export function ChatPanel() {
  const { state, selectedBlock, updateBlock, selectBlock } = useEditMode();

  // Per-block conversation history, preserved when switching blocks
  const [conversations, setConversations] = useState<Map<string, BlockConversation>>(new Map);
  // Block metadata cache (type -> metadata), fetched once per block type
  const [metadataCache, setMetadataCache] = useState<Map<string, BlockMetadata>>(new Map);
  // Track which blocks are currently loading (per-block, not global)
  const [loadingBlocks, setLoadingBlocks] = useState<Set<string>>(new Set);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);

  // Track the current block to detect changes
  const prevBlockIdRef = useRef<string | null>(null);

  // Track metadata fetch attempts to allow retry on re-select
  const metadataFetchedRef = useRef<Set<string>>(new Set);

  // Fetch block metadata when a new block type is selected
  useEffect(() => {
    if (!selectedBlock) return;
    if (metadataCache.has(selectedBlock.type)) return;
    // Skip if we already have an in-flight fetch (but allow retry on re-select)
    if (metadataFetchedRef.current.has(selectedBlock.type)) return;
    metadataFetchedRef.current.add(selectedBlock.type);

    let cancelled = false;
    setIsMetadataLoading(true);

    fetch(`/api/admin/blocks/${encodeURIComponent(selectedBlock.type)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (!data.error) {
          setMetadataCache((prev) => {
            const next = new Map(prev);
            next.set(selectedBlock.type, data as BlockMetadata);
            return next;
          });
        }
      })
      .catch(() => {
        // Allow retry on next block selection by removing from fetched set
        if (!cancelled) metadataFetchedRef.current.delete(selectedBlock.type);
      })
      .finally(() => {
        if (!cancelled) setIsMetadataLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedBlock?.type, metadataCache]);

  // Create or retrieve conversation when block changes
  useEffect(() => {
    if (!selectedBlock) {
      prevBlockIdRef.current = null;
      return;
    }

    if (selectedBlock.id === prevBlockIdRef.current) return;
    prevBlockIdRef.current = selectedBlock.id;

    // If conversation already exists for this block, keep it
    if (conversations.has(selectedBlock.id)) return;

    const metadata = metadataCache.get(selectedBlock.type);
    const label = metadata?.label || selectedBlock.type;

    // Create initial conversation with welcome message
    const welcomeMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'system',
      content: `Editing ${label} block. Describe what you want to change.`,
      timestamp: Date.now(),
    };

    const conversation: BlockConversation = {
      blockId: selectedBlock.id,
      blockType: selectedBlock.type,
      messages: [welcomeMessage],
      apiHistory: [],
    };

    setConversations((prev) => {
      const next = new Map(prev);
      next.set(selectedBlock.id, conversation);
      return next;
    });
  }, [selectedBlock?.id, selectedBlock?.type, conversations, metadataCache]);

  // Update welcome message once metadata loads (if conversation was created before metadata arrived)
  useEffect(() => {
    if (!selectedBlock) return;
    const metadata = metadataCache.get(selectedBlock.type);
    if (!metadata) return;

    const conv = conversations.get(selectedBlock.id);
    if (!conv) return;

    // Update welcome message if it still uses the raw type name
    if (conv.messages.length === 1 && conv.messages[0].role === 'system' && conv.messages[0].content.includes(selectedBlock.type) && metadata.label !== selectedBlock.type) {
      setConversations((prev) => {
        const next = new Map(prev);
        const updated = { ...conv, messages: [{ ...conv.messages[0], content: `Editing ${metadata.label} block. Describe what you want to change.` }] };
        next.set(selectedBlock.id, updated);
        return next;
      });
    }
  }, [selectedBlock?.id, selectedBlock?.type, metadataCache, conversations]);

  // Send a chat message and get AI response
  const handleSend = useCallback(async (message: string) => {
    if (!selectedBlock || loadingBlocks.has(selectedBlock.id)) return;

    const blockId = selectedBlock.id;
    // Read fresh props from state to avoid stale data after accepting a proposal
    const freshBlock = state.page.blocks.find((b) => b.id === blockId);
    const currentProps = (freshBlock?.props || selectedBlock.props) as Record<string, unknown>;

    // Add user message to conversation
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };

    const currentConv = conversations.get(blockId);
    // Cap history to last 10 exchanges (20 messages) to stay within API token limits
    const fullHistory = currentConv?.apiHistory || [];
    const apiHistory = fullHistory.slice(-20);

    setConversations((prev) => {
      const next = new Map(prev);
      const conv = next.get(blockId);
      if (conv) {
        next.set(blockId, { ...conv, messages: [...conv.messages, userMessage] });
      }
      return next;
    });

    setLoadingBlocks((prev) => new Set(prev).add(blockId));

    try {
      const response = await fetch('/api/admin/ai/edit-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockType: selectedBlock.type,
          currentProps,
          userRequest: message,
          conversationHistory: apiHistory,
        }),
      });

      const data = await response.json();

      if (data.error) {
        const errorMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'system',
          content: data.error,
          timestamp: Date.now(),
        };

        setConversations((prev) => {
          const next = new Map(prev);
          const conv = next.get(blockId);
          if (conv) {
            next.set(blockId, { ...conv, messages: [...conv.messages, errorMessage] });
          }
          return next;
        });
        return;
      }

      // Compute diffs
      const metadata = metadataCache.get(selectedBlock.type);
      const fields: EditableField[] = metadata?.fields || [];
      const diffs = computePropDiffs(fields, currentProps, data.updatedProps);

      // Create assistant message with proposal
      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: data.explanation,
        timestamp: Date.now(),
        proposal: {
          updatedProps: data.updatedProps,
          explanation: data.explanation,
          diffs,
          status: 'pending',
        },
      };

      // Update conversation with assistant message and API history
      setConversations((prev) => {
        const next = new Map(prev);
        const conv = next.get(blockId);
        if (conv) {
          next.set(blockId, {
            ...conv,
            messages: [...conv.messages, assistantMessage],
            apiHistory: [
              ...conv.apiHistory,
              { role: 'user' as const, content: message },
              { role: 'assistant' as const, content: data.explanation },
            ],
          });
        }
        return next;
      });
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'system',
        content: error instanceof Error ? error.message : 'Request failed',
        timestamp: Date.now(),
      };

      setConversations((prev) => {
        const next = new Map(prev);
        const conv = next.get(blockId);
        if (conv) {
          next.set(blockId, { ...conv, messages: [...conv.messages, errorMessage] });
        }
        return next;
      });
    } finally {
      setLoadingBlocks((prev) => {
        const next = new Set(prev);
        next.delete(blockId);
        return next;
      });
    }
  }, [selectedBlock, loadingBlocks, state.page.blocks, conversations, metadataCache]);

  // Accept a proposal — apply the changes
  const handleAcceptProposal = useCallback((messageId: string) => {
    if (!selectedBlock) return;

    const conv = conversations.get(selectedBlock.id);
    if (!conv) return;

    const message = conv.messages.find((m) => m.id === messageId);
    if (!message?.proposal || message.proposal.status !== 'pending') return;

    // Apply the changes
    updateBlock(selectedBlock.id, message.proposal.updatedProps);

    // Update the proposal status
    setConversations((prev) => {
      const next = new Map(prev);
      const c = next.get(selectedBlock.id);
      if (!c) return next;

      const updatedMessages = c.messages.map((m) =>
        m.id === messageId && m.proposal
          ? { ...m, proposal: { ...m.proposal, status: 'accepted' as const } }
          : m
      );

      next.set(selectedBlock.id, { ...c, messages: updatedMessages });
      return next;
    });
  }, [selectedBlock, conversations, updateBlock]);

  // Reject a proposal — discard the changes
  const handleRejectProposal = useCallback((messageId: string) => {
    if (!selectedBlock) return;

    setConversations((prev) => {
      const next = new Map(prev);
      const c = next.get(selectedBlock.id);
      if (!c) return next;

      const updatedMessages = c.messages.map((m) =>
        m.id === messageId && m.proposal
          ? { ...m, proposal: { ...m.proposal, status: 'rejected' as const } }
          : m
      );

      next.set(selectedBlock.id, { ...c, messages: updatedMessages });
      return next;
    });
  }, [selectedBlock]);

  // Handle clicking a suggested property — sends it as a chat message
  const handleSuggestedProperty = useCallback((fieldLabel: string) => {
    handleSend(`Improve the ${fieldLabel}`);
  }, [handleSend]);

  // Handle clicking a specific array item
  const handleArrayItemClick = useCallback((fieldLabel: string, index: number, itemTitle: string) => {
    handleSend(`Edit ${fieldLabel} #${index + 1}: "${itemTitle}"`);
  }, [handleSend]);

  // ---- Render ----

  // No block selected — show page settings
  if (!selectedBlock) {
    return (
      <div className="h-full flex flex-col bg-white border-l border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Edit Page</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <PageSettingsPanel />
        </div>
      </div>
    );
  }

  // Block selected — show chat interface
  const metadata = metadataCache.get(selectedBlock.type);
  const conversation = conversations.get(selectedBlock.id);
  const messages = conversation?.messages || [];

  const blockLabel = metadata?.label || selectedBlock.type;
  const blockDescription = metadata?.description || '';
  const blockIcon = metadata?.icon || '';

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {blockIcon && (
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <span className="text-sm text-primary-700">{blockIcon}</span>
              </div>
            )}
            <div>
              <h2 className="font-semibold text-gray-900">{blockLabel}</h2>
              {blockDescription && (
                <p className="text-xs text-gray-500">{blockDescription}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => selectBlock(null)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content overview — shown when conversation has only the welcome message */}
      {messages.length <= 1 && metadata?.fields && !loadingBlocks.has(selectedBlock.id) && (() => {
        const currentProps = selectedBlock.props as Record<string, unknown>;
        const arrayFields = metadata.fields.filter((f) => f.type === 'array');
        const scalarFields = metadata.fields.filter((f) => f.type === 'string' || f.type === 'enum');

        return (
          <div className="px-4 pt-3 pb-1 space-y-3 overflow-y-auto max-h-[50%]">
            {/* Array items (columns, features, etc.) */}
            {arrayFields.map((field) => {
              const items = currentProps[field.name];
              if (!Array.isArray(items) || items.length === 0) return null;

              // Find a display field for each item (title, label, name, heading, text)
              const displayKey = ['title', 'label', 'name', 'heading', 'text'].find(
                (k) => typeof items[0]?.[k] === 'string'
              );

              return (
                <div key={field.name}>
                  <p className="text-xs text-gray-400 mb-1.5">{field.label} ({items.length}):</p>
                  <div className="space-y-1">
                    {items.map((item, i) => {
                      const itemTitle = displayKey ? String(item[displayKey]) : `Item ${i + 1}`;
                      return (
                        <button
                          key={i}
                          onClick={() => handleArrayItemClick(field.label, i, itemTitle)}
                          className="w-full text-left px-3 py-2 text-sm bg-gray-50 rounded-lg hover:bg-primary-50 hover:text-primary-700 transition-colors flex items-center gap-2"
                        >
                          <span className="w-5 h-5 bg-gray-200 rounded text-xs flex items-center justify-center text-gray-500 flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="truncate">{itemTitle}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Scalar field quick edits */}
            {scalarFields.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1.5">Quick edits:</p>
                <div className="flex flex-wrap gap-1.5">
                  {scalarFields.slice(0, 6).map((field) => (
                    <button
                      key={field.name}
                      onClick={() => handleSuggestedProperty(field.label)}
                      className="px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-primary-50 hover:text-primary-700 transition-colors"
                    >
                      {field.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Loading metadata */}
      {isMetadataLoading && (
        <div className="px-4 py-2">
          <p className="text-xs text-gray-400">Loading block info...</p>
        </div>
      )}

      {/* Chat messages */}
      <ChatMessages
        messages={messages}
        onAcceptProposal={handleAcceptProposal}
        onRejectProposal={handleRejectProposal}
        isLoading={loadingBlocks.has(selectedBlock.id)}
      />

      {/* Chat input */}
      <ChatInput
        onSend={handleSend}
        isDisabled={loadingBlocks.has(selectedBlock.id)}
        placeholder={`Tell me what to change in this ${blockLabel}...`}
      />
    </div>
  );
}
