'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { BlockPicker } from '@/components/admin/BlockPicker';
import type { BlockInstance } from '@/core/block-system/types';

interface PageBlocksEditorProps {
  pageId: string;
  initialBlocks: BlockInstance[];
}

export function PageBlocksEditor({ pageId, initialBlocks }: PageBlocksEditorProps) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<BlockInstance[]>(initialBlocks);
  const [showPicker, setShowPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleBlockSelect = useCallback(async (blockMeta: { type: string; version: number; defaultProps: unknown }) => {
    const newBlock: BlockInstance = {
      id: `block_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`,
      type: blockMeta.type,
      version: blockMeta.version,
      props: blockMeta.defaultProps,
    };

    let updatedBlocks: BlockInstance[] = [];
    setBlocks(prev => {
      updatedBlocks = [...prev, newBlock];
      return updatedBlocks;
    });
    setShowPicker(false);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/pages/${encodeURIComponent(pageId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: updatedBlocks,
          changeDescription: `Added ${blockMeta.type} block`,
        }),
      });

      if (!response.ok) {
        let message = 'Failed to save';
        try { const data = await response.json(); message = data.error || message; } catch {}
        throw new Error(message);
      }

      router.refresh();
    } catch (error) {
      console.error('Error adding block:', error);
      setBlocks(prev => prev.filter(b => b.id !== newBlock.id));
    } finally {
      setIsSaving(false);
    }
  }, [pageId, router]);

  const handleDeleteBlock = useCallback(async (blockId: string) => {
    let previousBlocks: BlockInstance[] = [];
    let updatedBlocks: BlockInstance[] = [];
    setBlocks(prev => {
      previousBlocks = prev;
      updatedBlocks = prev.filter((b) => b.id !== blockId);
      return updatedBlocks;
    });
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/pages/${encodeURIComponent(pageId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: updatedBlocks,
          changeDescription: 'Removed block',
        }),
      });

      if (!response.ok) {
        let message = 'Failed to save';
        try { const data = await response.json(); message = data.error || message; } catch {}
        throw new Error(message);
      }

      router.refresh();
    } catch (error) {
      console.error('Error removing block:', error);
      setBlocks(previousBlocks);
    } finally {
      setIsSaving(false);
    }
  }, [pageId, router]);

  return (
    <>
      {blocks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-8">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Start building your page</h3>
          <p className="text-gray-500 text-center max-w-sm mb-6">
            Add your first block to start designing this page. Choose from heroes, features, CTAs, and more.
          </p>
          <Button onClick={() => setShowPicker(true)} disabled={isSaving}>
            Add First Block
          </Button>
        </div>
      ) : (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Blocks</h2>
            <Button variant="outline" size="sm" onClick={() => setShowPicker(true)} disabled={isSaving}>
              Add Block
            </Button>
          </div>
          <div className="space-y-2">
            {blocks.map((block, index) => (
              <div
                key={block.id}
                className="p-3 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors bg-gray-50/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-xs font-mono">{index + 1}</span>
                    <span className="font-medium text-sm text-gray-900">{block.type}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteBlock(block.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove block"
                    disabled={isSaving}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          {isSaving && (
            <p className="text-xs text-gray-500 mt-2">Saving...</p>
          )}
        </div>
      )}

      <BlockPicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleBlockSelect}
      />
    </>
  );
}
