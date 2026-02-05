import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { getContentProvider } from '@/infrastructure';
import { PageEditorClient } from './PageEditorClient';

interface PageEditorProps {
  params: Promise<{ pageId: string }>;
}

export default async function PageEditorPage({ params }: PageEditorProps) {
  const { pageId } = await params;
  const provider = getContentProvider();
  const page = await provider.getPage(pageId);

  if (!page) {
    notFound();
  }

  const primaryPath = Object.values(page.paths)[0] || '';

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/pages"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{page.title}</h1>
            <p className="text-gray-600 mt-1">
              <code className="text-sm">/{primaryPath}</code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
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
          <PageEditorClient pageId={page.id} revisions={page.revisions || []} />
          <a
            href={`/${page.locale}${primaryPath ? `/${primaryPath}` : ''}?edit=true`}
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
        </div>
      </div>

      {/* Page Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Blocks</h2>
            {page.blocks.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                <div className="text-4xl mb-3">📦</div>
                <p className="text-gray-500 mb-4">No blocks yet</p>
                <Button variant="outline" size="sm">
                  Add Block
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {page.blocks.map((block, index) => (
                  <div
                    key={block.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-sm">{index + 1}</span>
                        <span className="font-medium text-gray-900">{block.type}</span>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Page Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  defaultValue={page.title}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Path
                </label>
                <input
                  type="text"
                  defaultValue={primaryPath}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Title
                </label>
                <input
                  type="text"
                  defaultValue={page.seo?.metaTitle || ''}
                  placeholder="Page title for search engines"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Description
                </label>
                <textarea
                  rows={3}
                  defaultValue={page.seo?.metaDescription || ''}
                  placeholder="Brief description for search results"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Page Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Info</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">ID</dt>
                <dd className="text-gray-900 font-mono">{page.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Locale</dt>
                <dd className="text-gray-900">{page.locale}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-900">
                  {page.createdAt.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Updated</dt>
                <dd className="text-gray-900">
                  {page.updatedAt.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </dd>
              </div>
              {page.revisions && page.revisions.length > 0 && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Revisions</dt>
                  <dd className="text-gray-900">{page.revisions.length}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
