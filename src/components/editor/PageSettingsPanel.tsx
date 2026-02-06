'use client';

/**
 * Page Settings Panel
 *
 * Shown when no block is selected. Allows editing page-level SEO fields
 * (meta title, meta description, page URL) with AI improvement support.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditMode } from './EditModeProvider';
import { Button } from '@/components/ui/Button';

type PageField = 'metaTitle' | 'metaDescription' | 'slug';

interface EditingState {
  step: 'idle' | 'editing';
  field?: PageField;
  label?: string;
}

export function PageSettingsPanel() {
  const { state, updatePage } = useEditMode();
  const [editingState, setEditingState] = useState<EditingState>({ step: 'idle' });
  const [fieldInput, setFieldInput] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const currentMetaTitle = state.page.seo?.metaTitle || '';
  const currentMetaDescription = state.page.seo?.metaDescription || '';
  const currentSlug = Object.values(state.page.paths)[0] || '';

  const handleFieldEdit = useCallback((field: PageField, label: string) => {
    const currentValue =
      field === 'metaTitle' ? currentMetaTitle :
      field === 'metaDescription' ? currentMetaDescription :
      currentSlug;
    setFieldInput(currentValue);
    setEditingState({ step: 'editing', field, label });
  }, [currentMetaTitle, currentMetaDescription, currentSlug]);

  const handleFieldSave = useCallback(() => {
    if (editingState.step !== 'editing' || !editingState.field) return;
    const { field } = editingState;

    if (field === 'metaTitle') {
      updatePage({ seo: { ...state.page.seo, metaTitle: fieldInput } });
    } else if (field === 'metaDescription') {
      updatePage({ seo: { ...state.page.seo, metaDescription: fieldInput } });
    } else if (field === 'slug') {
      const locale = Object.keys(state.page.paths)[0] || state.page.locale;
      updatePage({ paths: { [locale]: fieldInput } });
    }

    setEditingState({ step: 'idle' });
    setFieldInput('');
  }, [editingState, fieldInput, state.page, updatePage]);

  const handleAIImprove = useCallback(async () => {
    if (editingState.step !== 'editing' || !editingState.field || editingState.field === 'slug') return;

    setIsAILoading(true);
    try {
      const content = fieldInput || (editingState.field === 'metaTitle' ? state.page.title : '');
      const response = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'improve',
          content,
          type: 'seo',
          instructions: editingState.field === 'metaTitle'
            ? `This is a page meta title. The page is titled "${state.page.title}". Optimize it for search engines. Return only the improved title text.`
            : `This is a page meta description. The page is titled "${state.page.title}". Optimize it for search engines. Keep it under 160 characters. Return only the improved description text.`,
        }),
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else if (data.result) {
        setFieldInput(data.result);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'AI request failed');
    } finally {
      setIsAILoading(false);
    }
  }, [editingState, fieldInput, state.page]);

  useEffect(() => {
    if (editingState.step === 'editing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingState]);

  if (editingState.step === 'editing' && editingState.field) {
    return (
      <div className="p-4">
        <button
          onClick={() => { setEditingState({ step: 'idle' }); setFieldInput(''); }}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <label className="block text-sm font-medium text-gray-700 mb-2">
          {editingState.label}
        </label>

        {editingState.field === 'slug' ? (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={fieldInput}
            onChange={(e) => setFieldInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleFieldSave(); } }}
            placeholder="e.g. about-us"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        ) : (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            rows={editingState.field === 'metaDescription' ? 4 : 2}
            value={fieldInput}
            onChange={(e) => setFieldInput(e.target.value)}
            placeholder={editingState.field === 'metaDescription' ? 'Brief description for search results' : 'Page title for search engines'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        )}

        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={handleFieldSave} disabled={isAILoading} className="flex-1">
            Save
          </Button>
          <Button size="sm" variant="ghost" disabled={isAILoading} onClick={() => { setEditingState({ step: 'idle' }); setFieldInput(''); }}>
            Cancel
          </Button>
        </div>

        {editingState.field !== 'slug' && (
          <button
            onClick={handleAIImprove}
            disabled={isAILoading}
            className="w-full mt-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAILoading ? (
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
    );
  }

  // Idle state — show page fields as clickable options
  return (
    <div className="p-4">
      <p className="text-gray-600 text-sm mb-4">
        Update page settings, or click a block on the left to edit it.
      </p>
      <div className="space-y-2 mb-6">
        <button
          onClick={() => handleFieldEdit('metaTitle', 'Meta Title')}
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
          onClick={() => handleFieldEdit('metaDescription', 'Meta Description')}
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
          onClick={() => handleFieldEdit('slug', 'Page URL')}
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
  );
}
