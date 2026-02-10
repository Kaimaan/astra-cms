'use client';

/**
 * Edit Mode Page
 *
 * Wraps the page in edit mode with:
 * - Toolbar with save/discard buttons
 * - Page preview with selectable blocks
 * - Chat panel for editing
 */

import { useCallback, useEffect, useState } from 'react';
import { EditModeProvider, useEditMode } from './EditModeProvider';
import { EditableBlockRenderer } from './EditableBlockRenderer';
import { ChatPanel } from './ChatPanel';
import { BlockPropertiesPanel } from './BlockPropertiesPanel';
import { PageSettingsPanel } from './PageSettingsPanel';
import { Button } from '@/components/ui/Button';
import type { Page, HeaderConfig, FooterConfig } from '@/core/content/types';

interface EditModePageProps {
  page: Page;
  headerConfig?: HeaderConfig | null;
  footerConfig?: FooterConfig | null;
}

export function EditModePage({ page, headerConfig, footerConfig }: EditModePageProps) {
  return (
    <EditModeProvider page={page}>
      <EditModeLayout headerConfig={headerConfig} footerConfig={footerConfig} />
    </EditModeProvider>
  );
}

function EditModeLayout({ headerConfig, footerConfig }: { headerConfig?: HeaderConfig | null; footerConfig?: FooterConfig | null }) {
  const { state, save, discard, selectBlock } = useEditMode();
  const { isDirty, isSaving, error } = state;
  const [isPublishing, setIsPublishing] = useState(false);
  const [pageStatus, setPageStatus] = useState(state.page.status);

  const handlePublishToggle = useCallback(async () => {
    setIsPublishing(true);
    try {
      const method = pageStatus === 'published' ? 'DELETE' : 'POST';
      const response = await fetch(
        `/api/admin/pages/${encodeURIComponent(state.page.id)}/publish`,
        { method }
      );
      if (response.ok) {
        const updated = await response.json();
        setPageStatus(updated.status);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update page status');
      }
    } catch {
      alert('Failed to update page status');
    } finally {
      setIsPublishing(false);
    }
  }, [pageStatus, state.page.id]);

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
    // Go back to where the user came from (usually admin pages list)
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/admin/pages';
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-gray-100 flex flex-col">
      {/* Toolbar */}
      <div className="h-14 bg-white border-b border-gray-200 flex-shrink-0">
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
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  pageStatus === 'published'
                    ? 'bg-green-100 text-green-800'
                    : pageStatus === 'scheduled'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {pageStatus}
              </span>
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

            {pageStatus === 'published' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePublishToggle}
                isLoading={isPublishing}
                disabled={isDirty}
              >
                Unpublish
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handlePublishToggle}
                isLoading={isPublishing}
                disabled={isDirty}
                className="bg-green-600 hover:bg-green-700 active:bg-green-800"
              >
                Publish
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Page preview */}
        <div className="flex-1 overflow-y-auto">
          <div className="bg-white min-h-full">
            {headerConfig && <HeaderPreview config={headerConfig} />}
            <EditablePageContent />
            {footerConfig && <FooterPreview config={footerConfig} />}
          </div>
        </div>

        {/* Side panel */}
        <div className="w-80 flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
          {!state.selectedBlockId ? (
            <PageSettingsPanel />
          ) : state.editMode === 'ai' ? (
            <ChatPanel />
          ) : (
            <BlockPropertiesPanel />
          )}
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

/**
 * Non-interactive header preview for edit mode
 */
function HeaderPreview({ config }: { config: HeaderConfig }) {
  const { logo, navigation, cta } = config;

  return (
    <div className="pointer-events-none opacity-60">
      <header className="w-full bg-white border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2 font-semibold text-gray-900">
                {logo?.src ? (
                  <img src={logo.src} alt={logo?.text || 'Logo'} className="h-8 w-auto" />
                ) : (
                  <span className="text-xl">{logo?.text}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-8">
              {navigation?.map((item) => (
                <span key={item.href} className="text-sm font-medium text-gray-600">
                  {item.label}
                </span>
              ))}
              {cta && (
                <span className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg">
                  {cta.label}
                </span>
              )}
            </div>
          </div>
        </nav>
      </header>
    </div>
  );
}

/**
 * Non-interactive footer preview for edit mode
 */
function FooterPreview({ config }: { config: FooterConfig }) {
  const { logo, description, linkGroups, copyright } = config;

  return (
    <div className="pointer-events-none opacity-60">
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              {logo && (
                <div className="flex items-center gap-2 mb-4">
                  {logo.src ? (
                    <img src={logo.src} alt={logo.text || 'Logo'} className="h-8 w-auto" />
                  ) : (
                    <span className="text-xl font-semibold text-white">{logo.text}</span>
                  )}
                </div>
              )}
              {description && <p className="text-sm text-gray-400 mb-6">{description}</p>}
            </div>
            {linkGroups?.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                  {group.title}
                </h3>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <span className="text-sm text-gray-400">{link.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {copyright && (
            <div className="mt-12 pt-8 border-t border-gray-800">
              <p className="text-sm text-gray-500 text-center">{copyright}</p>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
