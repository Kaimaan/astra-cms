'use client';

/**
 * Chat Panel
 *
 * Chat interface for editing blocks via natural language.
 * Shows editable properties as buttons, then asks for new values.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditMode } from './EditModeProvider';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import * as LucideIcons from 'lucide-react';

// Get a Lucide icon component by name
function getIconComponent(name: string): LucideIcons.LucideIcon | null {
  const icons = LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>;
  return icons[name] || null;
}

// Counter for unique message IDs
let messageIdCounter = 0;
const generateMessageId = () => `msg_${++messageIdCounter}_${Date.now()}`;

// Block metadata (client-safe, no server imports)
const BLOCK_META: Record<string, { label: string; description: string; icon: string }> = {
  hero: {
    label: 'Hero',
    description: 'Large hero section with title, subtitle, and call-to-action',
    icon: '🎯',
  },
  features: {
    label: 'Features',
    description: 'Grid of features with icons and descriptions',
    icon: '✨',
  },
  cta: {
    label: 'Call to Action',
    description: 'Call-to-action section with button',
    icon: '📢',
  },
  'rich-text': {
    label: 'Rich Text',
    description: 'Free-form HTML content',
    icon: '📝',
  },
  video: {
    label: 'Video',
    description: 'Embedded video player',
    icon: '🎬',
  },
  'blog-list': {
    label: 'Blog List',
    description: 'Dynamic list of blog posts',
    icon: '📰',
  },
  'team-list': {
    label: 'Team',
    description: 'Dynamic list of team members',
    icon: '👥',
  },
};

// Editable properties for each block type
const BLOCK_PROPERTIES: Record<string, Array<{ key: string; label: string; type: 'text' | 'button' | 'enum' | 'array' }>> = {
  hero: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'cta', label: 'Primary Button', type: 'button' },
    { key: 'secondaryCta', label: 'Secondary Button', type: 'button' },
    { key: 'alignment', label: 'Alignment', type: 'enum' },
    { key: 'backgroundImage', label: 'Background Image', type: 'text' },
  ],
  features: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'text' },
    { key: 'features', label: 'Features', type: 'array' },
    { key: 'columns', label: 'Columns', type: 'enum' },
  ],
  cta: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'buttonText', label: 'Button Text', type: 'text' },
    { key: 'buttonHref', label: 'Button Link', type: 'text' },
    { key: 'variant', label: 'Style', type: 'enum' },
  ],
  'rich-text': [
    { key: 'content', label: 'Content', type: 'text' },
    { key: 'maxWidth', label: 'Max Width', type: 'enum' },
  ],
  video: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'url', label: 'Video URL', type: 'text' },
  ],
  'blog-list': [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'text' },
    { key: 'limit', label: 'Number of Posts', type: 'text' },
    { key: 'layout', label: 'Layout', type: 'enum' },
  ],
  'team-list': [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'text' },
    { key: 'limit', label: 'Number of Members', type: 'text' },
    { key: 'layout', label: 'Layout', type: 'enum' },
  ],
};

// Schema descriptions for each block type (for the AI)
const BLOCK_SCHEMAS: Record<string, string> = {
  hero: `- Title (title): string (required)
- Subtitle (subtitle): string (optional)
- Description (description): string (optional)
- Alignment (alignment): enum - options: left, center, right
- CTA Button (cta): object (optional)
  - Label (label): string
  - Href (href): string
  - Variant (variant): enum - options: primary, secondary, outline
- Secondary CTA (secondaryCta): object (optional)
  - Label (label): string
  - Href (href): string
  - Variant (variant): enum - options: primary, secondary, outline
- Background Image (backgroundImage): string (optional) - URL`,

  features: `- Title (title): string (optional)
- Subtitle (subtitle): string (optional)
- Features (features): array of objects
  - Icon (icon): string
  - Title (title): string (required)
  - Description (description): string (required)
- Columns (columns): enum - options: 2, 3, 4`,

  cta: `- Title (title): string (required)
- Description (description): string (optional)
- Button Text (buttonText): string (required)
- Button Href (buttonHref): string (required)
- Variant (variant): enum - options: primary, secondary, light`,

  'rich-text': `- Content (content): string (required) - HTML content
- Max Width (maxWidth): enum - options: sm, md, lg, full`,

  video: `- Title (title): string (optional)
- URL (url): string (required) - Video URL (YouTube, Vimeo, or direct)
- Autoplay (autoplay): boolean
- Controls (controls): boolean`,

  'blog-list': `- Title (title): string (optional)
- Subtitle (subtitle): string (optional)
- Category (category): string (optional) - Filter by category slug
- Limit (limit): number - Max posts to show
- Layout (layout): enum - options: grid, list, featured
- Columns (columns): enum - options: 2, 3, 4`,

  'team-list': `- Title (title): string (optional)
- Subtitle (subtitle): string (optional)
- Limit (limit): number - Max members to show
- Layout (layout): enum - options: grid, cards
- Columns (columns): enum - options: 2, 3, 4`,
};

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  buttons?: Array<{ label: string; action: string; value?: string }>;
}

// Array item properties (what fields each array item type has)
const ARRAY_ITEM_PROPERTIES: Record<string, Array<{ key: string; label: string; type: 'text' | 'button' | 'enum' }>> = {
  features: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'icon', label: 'Icon', type: 'text' },
  ],
};

type EditingState =
  | { step: 'select-property' }
  | { step: 'enter-value'; property: string; propertyLabel: string; propertyType: string }
  | { step: 'select-array-item'; property: string; propertyLabel: string }
  | { step: 'edit-array-item'; property: string; propertyLabel: string; itemIndex: number; itemTitle: string }
  | { step: 'edit-array-item-field'; property: string; itemIndex: number; field: string; fieldLabel: string; fieldType: string }
  | { step: 'editing' };

export function ChatPanel() {
  const { state, selectedBlock, updateBlock, selectBlock } = useEditMode();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingState, setEditingState] = useState<EditingState>({ step: 'select-property' });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get block metadata
  const blockMeta = selectedBlock
    ? BLOCK_META[selectedBlock.type] || { label: selectedBlock.type, description: 'Custom block', icon: '📦' }
    : null;

  // Get editable properties
  const properties = selectedBlock
    ? BLOCK_PROPERTIES[selectedBlock.type] || []
    : [];

  // Get schema description for AI
  const schemaDescription = selectedBlock
    ? BLOCK_SCHEMAS[selectedBlock.type] || 'Custom block with dynamic properties'
    : '';

  // Reset state when block changes
  useEffect(() => {
    setMessages([]);
    setEditingState({ step: 'select-property' });
    setInput('');
  }, [selectedBlock?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when entering value or editing array item field
  useEffect(() => {
    if ((editingState.step === 'enter-value' || editingState.step === 'edit-array-item-field') && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingState]);

  // Handle property selection
  const handlePropertyClick = useCallback((property: { key: string; label: string; type: string }) => {
    const currentValue = selectedBlock?.props?.[property.key as keyof typeof selectedBlock.props];

    // Handle array types - show list of items to select
    if (property.type === 'array' && Array.isArray(currentValue)) {
      setMessages([]);
      setEditingState({ step: 'select-array-item', property: property.key, propertyLabel: property.label });
      return;
    }

    let valueDisplay = '';
    if (property.type === 'button' && currentValue && typeof currentValue === 'object') {
      const btn = currentValue as { label?: string; href?: string };
      valueDisplay = btn.label ? `"${btn.label}" → ${btn.href || '(no link)'}` : '(not set)';
    } else if (currentValue !== undefined && currentValue !== null) {
      valueDisplay = String(currentValue).substring(0, 50);
    } else {
      valueDisplay = '(not set)';
    }

    setMessages([
      {
        id: generateMessageId(),
        role: 'system',
        content: `Editing **${property.label}**\nCurrent: ${valueDisplay}`,
        timestamp: new Date(),
      },
    ]);
    setEditingState({ step: 'enter-value', property: property.key, propertyLabel: property.label, propertyType: property.type });
  }, [selectedBlock]);

  // Handle array item selection
  const handleArrayItemClick = useCallback((property: string, propertyLabel: string, index: number, item: Record<string, unknown>) => {
    const itemTitle = (item.title as string) || `Item ${index + 1}`;
    setMessages([]);
    setEditingState({ step: 'edit-array-item', property, propertyLabel, itemIndex: index, itemTitle });
  }, []);

  // Handle array item field selection
  const handleArrayItemFieldClick = useCallback((property: string, itemIndex: number, field: { key: string; label: string; type: string }) => {
    const currentValue = selectedBlock?.props?.[property as keyof typeof selectedBlock.props];
    if (!Array.isArray(currentValue)) return;

    const item = currentValue[itemIndex] as Record<string, unknown>;
    const fieldValue = item?.[field.key];
    const valueDisplay = fieldValue !== undefined && fieldValue !== null
      ? String(fieldValue).substring(0, 50)
      : '(not set)';

    setMessages([
      {
        id: generateMessageId(),
        role: 'system',
        content: `Editing **${field.label}**\nCurrent: ${valueDisplay}`,
        timestamp: new Date(),
      },
    ]);
    setEditingState({ step: 'edit-array-item-field', property, itemIndex, field: field.key, fieldLabel: field.label, fieldType: field.type });
  }, [selectedBlock]);

  // Handle direct value update (user types their own)
  const handleDirectUpdate = useCallback(async () => {
    if (!input.trim() || !selectedBlock) return;

    const newValue = input.trim();

    // Add user message
    setMessages(prev => [...prev, {
      id: generateMessageId(),
      role: 'user',
      content: newValue,
      timestamp: new Date(),
    }]);

    setInput('');

    const currentProps = selectedBlock.props as Record<string, unknown>;
    let updatedProps: Record<string, unknown>;
    let confirmationLabel = '';
    let returnToState: EditingState = { step: 'select-property' };

    if (editingState.step === 'enter-value') {
      const { property, propertyLabel, propertyType } = editingState;
      confirmationLabel = propertyLabel;

      if (propertyType === 'button') {
        // For buttons, parse "label → url" or just set label
        const parts = newValue.split('→').map(s => s.trim());
        updatedProps = {
          ...currentProps,
          [property]: {
            label: parts[0],
            href: parts[1] || (currentProps[property] as { href?: string })?.href || '/',
            variant: (currentProps[property] as { variant?: string })?.variant || 'primary',
          },
        };
      } else {
        updatedProps = {
          ...currentProps,
          [property]: newValue,
        };
      }
    } else if (editingState.step === 'edit-array-item-field') {
      const { property, itemIndex, field, fieldLabel } = editingState;
      confirmationLabel = fieldLabel;

      const currentArray = currentProps[property] as Array<Record<string, unknown>>;
      const updatedArray = [...currentArray];
      updatedArray[itemIndex] = {
        ...updatedArray[itemIndex],
        [field]: newValue,
      };

      updatedProps = {
        ...currentProps,
        [property]: updatedArray,
      };

      // Return to array item editing after updating field
      const item = updatedArray[itemIndex];
      returnToState = {
        step: 'edit-array-item',
        property,
        propertyLabel: property,
        itemIndex,
        itemTitle: (item.title as string) || `Item ${itemIndex + 1}`,
      };
    } else {
      return;
    }

    updateBlock(selectedBlock.id, updatedProps);

    // Confirmation message
    setMessages(prev => [...prev, {
      id: generateMessageId(),
      role: 'assistant',
      content: `Updated ${confirmationLabel}.`,
      timestamp: new Date(),
    }]);

    // Return to appropriate state
    setTimeout(() => {
      setEditingState(returnToState);
    }, 500);
  }, [input, selectedBlock, editingState, updateBlock]);

  // Handle AI-assisted update
  const handleAIAssist = useCallback(async () => {
    if (!selectedBlock || !blockMeta || editingState.step !== 'enter-value') return;

    const { property, propertyLabel } = editingState;

    setMessages(prev => [...prev, {
      id: generateMessageId(),
      role: 'user',
      content: `Help me improve the ${propertyLabel.toLowerCase()}`,
      timestamp: new Date(),
    }]);

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/ai/edit-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockType: selectedBlock.type,
          blockLabel: blockMeta.label,
          schemaDescription,
          currentProps: selectedBlock.props,
          userRequest: `Improve the ${propertyLabel.toLowerCase()} to make it more engaging and professional. Keep the same general meaning but make it better.`,
          conversationHistory: [],
        }),
      });

      const result = await response.json();

      if (result.error) {
        setMessages(prev => [...prev, {
          id: generateMessageId(),
          role: 'assistant',
          content: `Error: ${result.error}`,
          timestamp: new Date(),
        }]);
      } else {
        updateBlock(selectedBlock.id, result.updatedProps);
        setMessages(prev => [...prev, {
          id: generateMessageId(),
          role: 'assistant',
          content: result.explanation,
          timestamp: new Date(),
        }]);
        setTimeout(() => {
          setEditingState({ step: 'select-property' });
        }, 500);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: generateMessageId(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get AI suggestion'}`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBlock, blockMeta, editingState, schemaDescription, updateBlock]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleDirectUpdate();
    }
  };

  const handleBack = useCallback(() => {
    if (editingState.step === 'edit-array-item-field') {
      // Go back to array item
      const { property, itemIndex } = editingState;
      const currentValue = selectedBlock?.props?.[property as keyof typeof selectedBlock.props];
      const item = Array.isArray(currentValue) ? currentValue[itemIndex] as Record<string, unknown> : null;
      const itemTitle = item ? ((item.title as string) || `Item ${itemIndex + 1}`) : `Item ${itemIndex + 1}`;
      setEditingState({ step: 'edit-array-item', property, propertyLabel: property, itemIndex, itemTitle });
      setMessages([]);
    } else if (editingState.step === 'edit-array-item') {
      // Go back to array item selection
      setEditingState({ step: 'select-array-item', property: editingState.property, propertyLabel: editingState.propertyLabel });
      setMessages([]);
    } else if (editingState.step === 'select-array-item') {
      // Go back to property selection
      setEditingState({ step: 'select-property' });
      setMessages([]);
    } else {
      setEditingState({ step: 'select-property' });
      setMessages([]);
    }
  }, [editingState, selectedBlock]);

  // No block selected state
  if (!selectedBlock || !blockMeta) {
    return (
      <div className="h-full flex flex-col bg-white border-l border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Edit Block</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <p className="text-gray-600 text-sm">Click on a block to select it and start editing</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">{blockMeta.icon}</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{blockMeta.label}</h2>
              <p className="text-xs text-gray-500">{blockMeta.description}</p>
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {editingState.step === 'select-property' && (
          <div>
            <p className="text-gray-600 text-sm mb-4">What would you like to edit?</p>
            <div className="space-y-2">
              {properties.map((prop) => {
                const currentValue = selectedBlock.props?.[prop.key as keyof typeof selectedBlock.props];
                let preview = '';

                if (prop.type === 'button' && currentValue && typeof currentValue === 'object') {
                  const btn = currentValue as { label?: string };
                  preview = btn.label || '';
                } else if (prop.type === 'array' && Array.isArray(currentValue)) {
                  preview = `${(currentValue as unknown[]).length} items`;
                } else if (prop.key === 'columns' && currentValue) {
                  preview = `${currentValue}-column layout`;
                } else if (currentValue) {
                  preview = String(currentValue).substring(0, 25);
                  if (String(currentValue).length > 25) preview += '...';
                }

                return (
                  <button
                    key={prop.key}
                    onClick={() => handlePropertyClick(prop)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{prop.label}</span>
                      {prop.type === 'button' && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Button</span>
                      )}
                    </div>
                    {preview && (
                      <p className="text-sm text-gray-500 mt-1 truncate">{preview}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {editingState.step === 'select-array-item' && (
          <div>
            {/* Back button */}
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <p className="text-gray-600 text-sm mb-4">Select an item to edit:</p>
            <div className="space-y-2">
              {(() => {
                const items = selectedBlock?.props?.[editingState.property as keyof typeof selectedBlock.props] as Array<Record<string, unknown>> | undefined;
                if (!items || !Array.isArray(items)) return null;

                return items.map((item, index) => {
                  const IconComponent = item.icon ? getIconComponent(item.icon as string) : null;
                  return (
                    <button
                      key={index}
                      onClick={() => handleArrayItemClick(editingState.property, editingState.propertyLabel, index, item)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {typeof item.icon === 'string' && (
                          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                            {IconComponent ? <IconComponent className="w-4 h-4" /> : <span className="text-sm">{item.icon}</span>}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-900 block truncate">
                            {(item.title as string) || `Item ${index + 1}`}
                          </span>
                          {typeof item.description === 'string' && (
                            <p className="text-sm text-gray-500 truncate">{item.description.substring(0, 40)}...</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {editingState.step === 'edit-array-item' && (
          <div>
            {/* Back button */}
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <p className="text-gray-600 text-sm mb-2">Editing: <strong>{editingState.itemTitle}</strong></p>
            <p className="text-gray-500 text-xs mb-4">What would you like to change?</p>
            <div className="space-y-2">
              {(() => {
                const itemFields = ARRAY_ITEM_PROPERTIES[editingState.property] || [];
                const items = selectedBlock?.props?.[editingState.property as keyof typeof selectedBlock.props] as Array<Record<string, unknown>> | undefined;
                const item = items?.[editingState.itemIndex];

                return itemFields.map((field) => {
                  const currentValue = item?.[field.key];
                  const preview = currentValue ? String(currentValue).substring(0, 30) : '';

                  return (
                    <button
                      key={field.key}
                      onClick={() => handleArrayItemFieldClick(editingState.property, editingState.itemIndex, field)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{field.label}</span>
                      {preview && (
                        <p className="text-sm text-gray-500 mt-1 truncate">{preview}{String(currentValue).length > 30 ? '...' : ''}</p>
                      )}
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {(editingState.step === 'enter-value' || editingState.step === 'edit-array-item-field') && (
          <div className="space-y-4">
            {/* Back button */}
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            {/* Messages */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm',
                  message.role === 'user' && 'bg-primary-600 text-white ml-8',
                  message.role === 'assistant' && 'bg-gray-100 text-gray-900 mr-8',
                  message.role === 'system' && 'bg-blue-50 text-blue-900 border border-blue-200'
                )}
              >
                <div dangerouslySetInnerHTML={{ __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
              </div>
            ))}

            {isLoading && (
              <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-500 mr-8">
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  AI is thinking...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input (when entering value or editing array item field) */}
      {(editingState.step === 'enter-value' || editingState.step === 'edit-array-item-field') && (
        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                editingState.step === 'enter-value' && editingState.propertyType === 'button'
                  ? 'Button text → /link'
                  : `Enter new ${editingState.step === 'enter-value' ? editingState.propertyLabel.toLowerCase() : editingState.fieldLabel.toLowerCase()}...`
              }
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              disabled={isLoading}
            />
            <Button size="sm" onClick={handleDirectUpdate} disabled={!input.trim() || isLoading}>
              Update
            </Button>
          </div>
          {editingState.step === 'enter-value' && (
            <button
              onClick={handleAIAssist}
              disabled={isLoading}
              className="w-full py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Let AI improve it
            </button>
          )}
        </div>
      )}
    </div>
  );
}
