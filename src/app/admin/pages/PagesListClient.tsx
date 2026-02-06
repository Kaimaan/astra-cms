'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface PageData {
  id: string;
  title: string;
  paths: Record<string, string>;
  locale: string;
  status: 'draft' | 'published' | 'scheduled';
  updatedAt: string;
}

interface PagesListClientProps {
  initialPages: PageData[];
}

export function PagesListClient({ initialPages }: PagesListClientProps) {
  const router = useRouter();
  const [pages, setPages] = useState<PageData[]>(initialPages);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [redirectEnabled, setRedirectEnabled] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PageData[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const pageToDelete = pages.find(p => p.id === showDeleteModal);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/admin/pages?search=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          // Exclude the page being deleted
          setSearchResults(data.filter((p: PageData) => p.id !== showDeleteModal));
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, showDeleteModal]);

  const resetDeleteModal = useCallback(() => {
    setShowDeleteModal(null);
    setRedirectEnabled(false);
    setRedirectTarget(null);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const handleDelete = async () => {
    if (!showDeleteModal) return;

    setIsDeleting(true);
    try {
      let url = `/api/admin/pages/${encodeURIComponent(showDeleteModal)}`;
      if (redirectEnabled && redirectTarget) {
        url += `?redirectTo=${encodeURIComponent(redirectTarget)}`;
      }

      const response = await fetch(url, { method: 'DELETE' });
      if (response.ok) {
        setPages(pages.filter(p => p.id !== showDeleteModal));
        resetDeleteModal();
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete page');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete page');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPageSlug = (paths: Record<string, string>) => {
    return Object.values(paths)[0] || '';
  };

  const selectedTargetPage = redirectTarget ? pages.find(p => p.id === redirectTarget) : null;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
          <p className="text-gray-600 mt-1">Manage your site pages</p>
        </div>
        <Link href="/admin/pages/new">
          <Button>Create Page</Button>
        </Link>
      </div>

      {pages.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">📄</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No pages yet</h2>
          <p className="text-gray-600 mb-6">
            Create your first page to get started.
          </p>
          <Link href="/admin/pages/new">
            <Button>Create Your First Page</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{page.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm text-gray-600">/{getPageSlug(page.paths)}</code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        page.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : page.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {page.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(page.updatedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/${getPageSlug(page.paths)}`}
                        target="_blank"
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                        title="View page"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                      <Link
                        href={`/${page.locale}${getPageSlug(page.paths) ? `/${getPageSlug(page.paths)}` : ''}?edit=true`}
                        className="p-2 text-gray-400 hover:text-primary-600 rounded-md hover:bg-primary-50 transition-colors"
                        title="Edit page"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => setShowDeleteModal(page.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                        title="Delete page"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && pageToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Delete Page</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>{pageToDelete.title}</strong>? This action cannot be undone.
            </p>

            {/* Redirect Option */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={redirectEnabled}
                  onChange={(e) => {
                    setRedirectEnabled(e.target.checked);
                    if (!e.target.checked) {
                      setRedirectTarget(null);
                      setSearchQuery('');
                      setSearchResults([]);
                    }
                  }}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Set up redirect to another page</span>
              </label>

              {redirectEnabled && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Redirect to:
                  </label>

                  {selectedTargetPage ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-green-800">
                          {selectedTargetPage.title}
                        </span>
                        <span className="text-sm text-green-600 ml-2">
                          /{getPageSlug(selectedTargetPage.paths)}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setRedirectTarget(null);
                          setSearchQuery('');
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search for a page..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      />

                      {isSearching && (
                        <div className="absolute right-3 top-2.5">
                          <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </div>
                      )}

                      {searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {searchResults.map((result) => (
                            <button
                              key={result.id}
                              onClick={() => {
                                setRedirectTarget(result.id);
                                setSearchQuery('');
                                setSearchResults([]);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                            >
                              <span className="font-medium text-gray-900">{result.title}</span>
                              <span className="text-sm text-gray-500 ml-2">/{getPageSlug(result.paths)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {searchQuery && searchQuery.length < 2 && (
                    <p className="text-xs text-gray-500 mt-1">Type at least 2 characters to search</p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={resetDeleteModal}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={isDeleting || (redirectEnabled && !redirectTarget)}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
