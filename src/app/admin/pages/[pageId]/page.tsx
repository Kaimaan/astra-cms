import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getContentProvider } from '@/infrastructure';
import { Header } from '@/components/global/Header';
import { Footer } from '@/components/global/Footer';
import { PageActions } from './PageActions';
import { PageBlocksEditor } from './PageBlocksEditor';

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
        <PageActions
          pageId={page.id}
          status={page.status}
          locale={page.locale}
          primaryPath={primaryPath}
          revisions={page.revisions || []}
        />
      </div>

      {/* Page Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area — Page Preview */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            {/* Live Header Preview */}
            <div className="pointer-events-none opacity-75 border-b border-gray-100">
              <Header />
            </div>

            {/* Page Content / Blocks */}
            <div className="bg-white min-h-[400px]">
              <PageBlocksEditor pageId={page.id} initialBlocks={page.blocks} />
            </div>

            {/* Live Footer Preview */}
            <div className="pointer-events-none opacity-75 border-t border-gray-100">
              <Footer />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Page Settings (read-only — use Edit Mode for changes) */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Title</dt>
                <dd className="text-gray-900 font-medium mt-0.5">{page.title}</dd>
              </div>
              <div>
                <dt className="text-gray-500">URL Path</dt>
                <dd className="text-gray-900 font-mono mt-0.5">/{primaryPath}</dd>
              </div>
            </dl>
          </div>

          {/* SEO (read-only) */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Meta Title</dt>
                <dd className="text-gray-900 mt-0.5">{page.seo?.metaTitle || <span className="text-gray-400 italic">Not set</span>}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Meta Description</dt>
                <dd className="text-gray-900 mt-0.5">{page.seo?.metaDescription || <span className="text-gray-400 italic">Not set</span>}</dd>
              </div>
            </dl>
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
