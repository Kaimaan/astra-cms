'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { RevisionHistoryPanel } from '@/components/admin/RevisionHistoryPanel';
import type { PageRevision, PageStatus } from '@/core/content/types';

interface PageActionsProps {
  pageId: string;
  status: PageStatus;
  locale: string;
  primaryPath: string;
  revisions: PageRevision[];
}

export function PageActions({ pageId, status, locale, primaryPath, revisions }: PageActionsProps) {
  const router = useRouter();
  const [showHistory, setShowHistory] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const response = await fetch(`/api/admin/pages/${encodeURIComponent(pageId)}/publish`, {
        method: 'POST',
      });
      if (response.ok) {
        setCurrentStatus('published');
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to publish page');
      }
    } catch (error) {
      console.error('Publish error:', error);
      alert('Failed to publish page');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setIsPublishing(true);
    try {
      const response = await fetch(`/api/admin/pages/${encodeURIComponent(pageId)}/publish`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setCurrentStatus('draft');
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to unpublish page');
      }
    } catch (error) {
      console.error('Unpublish error:', error);
      alert('Failed to unpublish page');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            currentStatus === 'published'
              ? 'bg-green-100 text-green-800'
              : currentStatus === 'scheduled'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {currentStatus}
        </span>

        <button
          onClick={() => setShowHistory(true)}
          className="px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          History
          {revisions.length > 0 && (
            <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded">
              {revisions.length}
            </span>
          )}
        </button>

        <a
          href={`/${locale}${primaryPath ? `/${primaryPath}` : ''}?edit=true`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          View page
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>

        <Button>Save Changes</Button>

        {currentStatus === 'published' ? (
          <Button
            variant="outline"
            onClick={handleUnpublish}
            isLoading={isPublishing}
          >
            Unpublish
          </Button>
        ) : (
          <Button
            onClick={handlePublish}
            isLoading={isPublishing}
            className="bg-green-600 hover:bg-green-700 active:bg-green-800"
          >
            Publish
          </Button>
        )}
      </div>

      <RevisionHistoryPanel
        pageId={pageId}
        revisions={revisions}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onRestoreComplete={() => router.refresh()}
      />
    </>
  );
}
