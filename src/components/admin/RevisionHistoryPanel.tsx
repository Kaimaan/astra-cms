'use client';

import { useState } from 'react';
import type { PageRevision } from '@/core/content/types';

interface RevisionHistoryPanelProps {
  pageId: string;
  revisions: PageRevision[];
  isOpen: boolean;
  onClose: () => void;
  onRestoreComplete: () => void;
}

export function RevisionHistoryPanel({
  pageId,
  revisions,
  isOpen,
  onClose,
  onRestoreComplete,
}: RevisionHistoryPanelProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRestore = async (revisionId: string) => {
    setIsRestoring(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/pages/${pageId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to restore revision');
      }

      setConfirmingId(null);
      onRestoreComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore');
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Edit History</h2>
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
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {revisions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No revision history yet</p>
                <p className="text-sm mt-1">Revisions are created when you save changes</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 mb-4">
                  {revisions.length} revision{revisions.length !== 1 ? 's' : ''} stored
                </p>

                {revisions.map((revision) => (
                  <div
                    key={revision.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(revision.createdAt)}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5 truncate">
                          {revision.changeDescription || 'No description'}
                        </p>
                        {revision.createdBy && (
                          <p className="text-xs text-gray-400 mt-1">
                            by {revision.createdBy}
                          </p>
                        )}
                      </div>

                      {confirmingId === revision.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRestore(revision.id)}
                            disabled={isRestoring}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50 transition-colors"
                          >
                            {isRestoring ? 'Restoring...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setConfirmingId(null)}
                            disabled={isRestoring}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmingId(revision.id)}
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-md transition-colors"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
