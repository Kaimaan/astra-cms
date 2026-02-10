'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';

interface BlockMeta {
  type: string;
  label: string;
  description: string;
  icon: string;
  category: string;
  version: number;
  defaultProps: unknown;
}

type BlockCategory = 'layout' | 'content' | 'media' | 'interactive';

const categoryLabels: Record<BlockCategory, string> = {
  content: 'Content',
  media: 'Media',
  layout: 'Layout',
  interactive: 'Interactive',
};

const categoryColors: Record<BlockCategory, string> = {
  content: 'bg-blue-100 text-blue-800',
  media: 'bg-purple-100 text-purple-800',
  layout: 'bg-green-100 text-green-800',
  interactive: 'bg-orange-100 text-orange-800',
};

const categoryIcons: Record<BlockCategory, string> = {
  content: '\u{1F4DD}',
  media: '\u{1F3AC}',
  layout: '\u{1F4D0}',
  interactive: '\u{1F518}',
};

interface BlockPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (block: BlockMeta) => void;
}

export function BlockPicker({ isOpen, onClose, onSelect }: BlockPickerProps) {
  const [blocks, setBlocks] = useState<BlockMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setIsLoading(true);

    fetch('/api/admin/blocks')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setBlocks(data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [isOpen]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const categories: BlockCategory[] = ['layout', 'content', 'media', 'interactive'];
  const grouped = categories.reduce((acc, cat) => {
    acc[cat] = blocks.filter((b) => b.category === cat);
    return acc;
  }, {} as Record<BlockCategory, BlockMeta[]>);
  const uncategorized = blocks.filter((b) => !b.category);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Add Block</h2>
            <p className="text-sm text-gray-500 mt-1">Choose a block to add to your page</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading blocks...</div>
          ) : blocks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No blocks registered</div>
          ) : (
            <div className="space-y-6">
              {categories.map((category) => {
                const catBlocks = grouped[category];
                if (catBlocks.length === 0) return null;
                return (
                  <section key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <span>{categoryIcons[category]}</span>
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        {categoryLabels[category]}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {catBlocks.map((block) => (
                        <button
                          key={block.type}
                          onClick={() => onSelect(block)}
                          className="text-left p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm">
                              {'\u{1F4E6}'}
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">{block.label}</span>
                              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium ${categoryColors[category]}`}>
                                {categoryLabels[category]}
                              </span>
                            </div>
                          </div>
                          {block.description && (
                            <p className="text-sm text-gray-500 mt-1 ml-11">{block.description}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })}

              {uncategorized.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <span>{'\u{1F4E6}'}</span>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Other
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {uncategorized.map((block) => (
                      <button
                        key={block.type}
                        onClick={() => onSelect(block)}
                        className="text-left p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm">
                            {'\u{1F4E6}'}
                          </div>
                          <span className="font-medium text-gray-900">{block.label}</span>
                        </div>
                        {block.description && (
                          <p className="text-sm text-gray-500 mt-1 ml-11">{block.description}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
