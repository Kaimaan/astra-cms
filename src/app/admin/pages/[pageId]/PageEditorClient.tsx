'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RevisionHistoryPanel } from '@/components/admin/RevisionHistoryPanel';
import type { PageRevision } from '@/core/content/types';

interface PageEditorClientProps {
  pageId: string;
  revisions: PageRevision[];
}

export function PageEditorClient({ pageId, revisions }: PageEditorClientProps) {
  const router = useRouter();
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
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
