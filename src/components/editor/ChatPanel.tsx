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
import * as LucideIcons from 'lucide-react';

// Get a Lucide icon component by name
function getIconComponent(name: string): LucideIcons.LucideIcon | null {
  const icons = LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>;
  return icons[name] || null;
}

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

type PageEditingState =
  | { step: 'idle' }
  | { step: 'editing-field'; field: 'metaTitle' | 'metaDescription' | 'slug'; label: string };

export function ChatPanel() {
  const { state, selectedBlock, updateBlock, selectBlock, updatePage } = useEditMode();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingState, setEditingState] = useState<EditingState>({ step: 'select-property' });
  const [pageEditingState, setPageEditingState] = useState<PageEditingState>({ step: 'idle' });
  const [pageFieldInput, setPageFieldInput] = useState('');
  const [isPageAILoading, setIsPageAILoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const pageInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Get block metadata
  const blockMeta = selectedBlock
    ? BLOCK_META[selectedBlock.type] || { label: selectedBlock.type, description: 'Custom block', icon: '📦' }
    : null;

  // Get editable properties
  const properties = selectedBlock
    ? BLOCK_PROPERTIES[selectedBlock.type] || []
    : [];

  // Reset state when block changes
  useEffect(() => {
    setEditingState({ step: 'select-property' });
    setInput('');
  }, [selectedBlock?.id]);

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
      setEditingState({ step: 'select-array-item', property: property.key, propertyLabel: property.label });
      return;
    }

    // Pre-fill input with current value
    if (property.type === 'button' && currentValue && typeof currentValue === 'object') {
      const btn = currentValue as { label?: string; href?: string };
      setInput(btn.label ? `${btn.label} → ${btn.href || '/'}` : '');
    } else if (currentValue !== undefined && currentValue !== null) {
      setInput(String(currentValue));
    } else {
      setInput('');
    }

    setEditingState({ step: 'enter-value', property: property.key, propertyLabel: property.label, propertyType: property.type });
  }, [selectedBlock]);

  // Handle array item selection
  const handleArrayItemClick = useCallback((property: string, propertyLabel: string, index: number, item: Record<string, unknown>) => {
    const itemTitle = (item.title as string) || `Item ${index + 1}`;
    setEditingState({ step: 'edit-array-item', property, propertyLabel, itemIndex: index, itemTitle });
  }, []);

  // Handle array item field selection
  const handleArrayItemFieldClick = useCallback((property: string, itemIndex: number, field: { key: string; label: string; type: string }) => {
    const currentValue = selectedBlock?.props?.[property as keyof typeof selectedBlock.props];
    if (!Array.isArray(currentValue)) return;

    const item = currentValue[itemIndex] as Record<string, unknown>;
    const fieldValue = item?.[field.key];
    setInput(fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : '');

    setEditingState({ step: 'edit-array-item-field', property, itemIndex, field: field.key, fieldLabel: field.label, fieldType: field.type });
  }, [selectedBlock]);

  // Handle direct value update (user saves their edit)
  const handleDirectUpdate = useCallback(() => {
    if (!selectedBlock) return;

    const newValue = input.trim();
    const currentProps = selectedBlock.props as Record<string, unknown>;
    let updatedProps: Record<string, unknown>;
    let returnToState: EditingState = { step: 'select-property' };

    if (editingState.step === 'enter-value') {
      const { property, propertyType } = editingState;

      if (propertyType === 'button') {
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
      const { property, itemIndex, field } = editingState;

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
    setInput('');
    setEditingState(returnToState);
  }, [input, selectedBlock, editingState, updateBlock]);

  // Handle AI-assisted update
  const handleAIAssist = useCallback(async () => {
    if (!selectedBlock || !blockMeta || editingState.step !== 'enter-value') return;

    const { propertyLabel, propertyType } = editingState;

    setIsLoading(true);

    try {
      const content = input || '';
      const response = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'improve',
          content,
          type: 'clarity',
          instructions: propertyType === 'button'
            ? `This is a button label for a "${blockMeta.label}" section. Improve it to be more compelling. Return only the improved text.`
            : `This is the "${propertyLabel}" of a "${blockMeta.label}" section on a website. Improve it to be more engaging and professional. Return only the improved text.`,
        }),
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else if (data.result) {
        setInput(data.result);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'AI request failed');
    } finally {
      setIsLoading(false);
    }
  }, [selectedBlock, blockMeta, editingState, input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleDirectUpdate();
    }
  };

  const handleBack = useCallback(() => {
    if (editingState.step === 'edit-array-item-field') {
      const { property, itemIndex } = editingState;
      const currentValue = selectedBlock?.props?.[property as keyof typeof selectedBlock.props];
      const item = Array.isArray(currentValue) ? currentValue[itemIndex] as Record<string, unknown> : null;
      const itemTitle = item ? ((item.title as string) || `Item ${itemIndex + 1}`) : `Item ${itemIndex + 1}`;
      setEditingState({ step: 'edit-array-item', property, propertyLabel: property, itemIndex, itemTitle });
    } else if (editingState.step === 'edit-array-item') {
      setEditingState({ step: 'select-array-item', property: editingState.property, propertyLabel: editingState.propertyLabel });
    } else {
      setEditingState({ step: 'select-property' });
    }
    setInput('');
  }, [editingState, selectedBlock]);

  // Get current page-level values
  const currentMetaTitle = state.page.seo?.metaTitle || '';
  const currentMetaDescription = state.page.seo?.metaDescription || '';
  const currentSlug = Object.values(state.page.paths)[0] || '';

  const handlePageFieldEdit = useCallback((field: 'metaTitle' | 'metaDescription' | 'slug', label: string) => {
    const currentValue = field === 'metaTitle' ? currentMetaTitle
      : field === 'metaDescription' ? currentMetaDescription
      : currentSlug;
    setPageFieldInput(currentValue);
    setPageEditingState({ step: 'editing-field', field, label });
  }, [currentMetaTitle, currentMetaDescription, currentSlug]);

  const handlePageFieldSave = useCallback(() => {
    if (pageEditingState.step !== 'editing-field') return;
    const { field } = pageEditingState;

    if (field === 'metaTitle') {
      updatePage({ seo: { ...state.page.seo, metaTitle: pageFieldInput } });
    } else if (field === 'metaDescription') {
      updatePage({ seo: { ...state.page.seo, metaDescription: pageFieldInput } });
    } else if (field === 'slug') {
      const locale = Object.keys(state.page.paths)[0] || state.page.locale;
      updatePage({ paths: { [locale]: pageFieldInput } });
    }

    setPageEditingState({ step: 'idle' });
    setPageFieldInput('');
  }, [pageEditingState, pageFieldInput, state.page, updatePage]);

  const handlePageAIImprove = useCallback(async () => {
    if (pageEditingState.step !== 'editing-field') return;
    const { field } = pageEditingState;
    if (field === 'slug') return;

    setIsPageAILoading(true);
    try {
      const content = pageFieldInput || (field === 'metaTitle' ? state.page.title : '');
      const response = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'improve',
          content,
          type: 'seo',
          instructions: field === 'metaTitle'
            ? `This is a page meta title. The page is titled "${state.page.title}". Optimize it for search engines. Return only the improved title text.`
            : `This is a page meta description. The page is titled "${state.page.title}". Optimize it for search engines. Keep it under 160 characters. Return only the improved description text.`,
        }),
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else if (data.result) {
        setPageFieldInput(data.result);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'AI request failed');
    } finally {
      setIsPageAILoading(false);
    }
  }, [pageEditingState, pageFieldInput, state.page]);

  // Focus page input when editing a field
  useEffect(() => {
    if (pageEditingState.step === 'editing-field' && pageInputRef.current) {
      pageInputRef.current.focus();
    }
  }, [pageEditingState]);

  // No block selected state
  if (!selectedBlock || !blockMeta) {
    return (
      <div className="h-full flex flex-col bg-white border-l border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Edit Page</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {pageEditingState.step === 'idle' && (
            <div>
              <p className="text-gray-600 text-sm mb-4">
                Update page settings, or click a block on the left to edit it.
              </p>
              <div className="space-y-2 mb-6">
                <button
                  onClick={() => handlePageFieldEdit('metaTitle', 'Meta Title')}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <span className="font-medium text-gray-900">Meta Title</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 truncate">
                    {currentMetaTitle || '(not set)'}
                  </p>
                </button>

                <button
                  onClick={() => handlePageFieldEdit('metaDescription', 'Meta Description')}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    <span className="font-medium text-gray-900">Meta Description</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 truncate">
                    {currentMetaDescription || '(not set)'}
                  </p>
                </button>

                <button
                  onClick={() => handlePageFieldEdit('slug', 'Page URL')}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="font-medium text-gray-900">Page URL</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 truncate">
                    /{currentSlug}{!currentSlug && ' (homepage)'}
                  </p>
                </button>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-3 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <p className="text-sm text-gray-500">Or click a block on the left to edit its content</p>
                </div>
              </div>
            </div>
          )}

          {pageEditingState.step === 'editing-field' && (
            <div>
              <button
                onClick={() => { setPageEditingState({ step: 'idle' }); setPageFieldInput(''); }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                {pageEditingState.label}
              </label>

              {pageEditingState.field === 'slug' ? (
                <input
                  ref={pageInputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  value={pageFieldInput}
                  onChange={(e) => setPageFieldInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handlePageFieldSave(); } }}
                  placeholder="e.g. about-us"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              ) : (
                <textarea
                  ref={pageInputRef as React.RefObject<HTMLTextAreaElement>}
                  rows={pageEditingState.field === 'metaDescription' ? 4 : 2}
                  value={pageFieldInput}
                  onChange={(e) => setPageFieldInput(e.target.value)}
                  placeholder={pageEditingState.field === 'metaDescription' ? 'Brief description for search results' : 'Page title for search engines'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              )}

              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handlePageFieldSave} disabled={isPageAILoading} className="flex-1">
                  Save
                </Button>
                <Button size="sm" variant="ghost" disabled={isPageAILoading} onClick={() => { setPageEditingState({ step: 'idle' }); setPageFieldInput(''); }}>
                  Cancel
                </Button>
              </div>

              {pageEditingState.field !== 'slug' && (
                <button
                  onClick={handlePageAIImprove}
                  disabled={isPageAILoading}
                  className="w-full mt-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPageAILoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Improving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Improve with AI
                    </>
                  )}
                </button>
              )}
            </div>
          )}
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
          <div>
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              {editingState.step === 'enter-value' ? editingState.propertyLabel : editingState.fieldLabel}
            </label>

            {editingState.step === 'enter-value' && editingState.propertyType === 'button' ? (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Button text → /link"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                disabled={isLoading}
              />
            ) : (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                rows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Enter ${editingState.step === 'enter-value' ? editingState.propertyLabel.toLowerCase() : editingState.fieldLabel.toLowerCase()}...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                disabled={isLoading}
              />
            )}

            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleDirectUpdate} disabled={isLoading} className="flex-1">
                Save
              </Button>
              <Button size="sm" variant="ghost" disabled={isLoading} onClick={handleBack}>
                Cancel
              </Button>
            </div>

            {editingState.step === 'enter-value' && (
              <button
                onClick={handleAIAssist}
                disabled={isLoading}
                className="w-full mt-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Improving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Improve with AI
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
