'use client';

/**
 * Edit Mode Page
 *
 * Wraps the page in edit mode with:
 * - Toolbar with save/discard buttons
 * - Page preview with selectable blocks
 * - Chat panel for editing
 */

import { useCallback, useEffect } from 'react';
import { EditModeProvider, useEditMode } from './EditModeProvider';
import { EditableBlockRenderer } from './EditableBlockRenderer';
import { ChatPanel } from './ChatPanel';
import { Button } from '@/components/ui/Button';
import type { Page } from '@/core/content/types';

interface EditModePageProps {
  page: Page;
}

export function EditModePage({ page }: EditModePageProps) {
  return (
    <EditModeProvider page={page}>
      <EditModeLayout />
    </EditModeProvider>
  );
}

function EditModeLayout() {
  const { state, save, discard, selectBlock } = useEditMode();
  const { isDirty, isSaving, error } = state;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty && !isSaving) {
          save();
        }
      }
      // Escape to deselect
      if (e.key === 'Escape') {
        selectBlock(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, isSaving, save, selectBlock]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleExitEditMode = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('edit');
    window.location.href = url.toString();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-50">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleExitEditMode}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Exit Edit Mode</span>
            </button>

            <div className="h-6 w-px bg-gray-200" />

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">{state.page.title}</span>
              {isDirty && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                  Unsaved
                </span>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {error && (
              <span className="text-sm text-red-600">{error}</span>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={discard}
              disabled={!isDirty || isSaving}
            >
              Discard
            </Button>

            <Button
              size="sm"
              onClick={save}
              isLoading={isSaving}
              disabled={!isDirty}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pt-14">
        {/* Page preview - add right margin for fixed chat panel */}
        <div className="mr-80 min-h-[calc(100vh-3.5rem)]">
          <div className="bg-white min-h-full">
            <EditablePageContent />
          </div>
        </div>

        {/* Chat panel - fixed position to prevent layout shifts */}
        <div className="fixed right-0 top-14 bottom-0 w-80">
          <ChatPanel />
        </div>
      </div>
    </div>
  );
}

/**
 * Renders page content with editable blocks
 */
function EditablePageContent() {
  const { state, selectBlock } = useEditMode();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Find the closest block element
      const target = e.target as HTMLElement;
      const blockElement = target.closest('[data-block-id]');

      if (blockElement) {
        e.stopPropagation();
        const blockId = blockElement.getAttribute('data-block-id');
        if (blockId) {
          selectBlock(blockId);
        }
      } else {
        // Clicked outside any block - deselect
        selectBlock(null);
      }
    },
    [selectBlock]
  );

  return (
    <div onClick={handleClick} className="cursor-pointer">
      <EditableBlockRenderer />
    </div>
  );
}
