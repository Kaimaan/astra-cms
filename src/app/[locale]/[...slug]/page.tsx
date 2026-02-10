import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { BlockRenderer } from '@/components/BlockRenderer';
import { EditModePage } from '@/components/editor';
import { getContentProvider } from '@/infrastructure';
import { generatePageMetadata, generate404Metadata } from '@/core/seo/metadata';
import config from '../../../../astra.config';

// ISR: revalidate every hour (can be overridden by on-demand revalidation)
export const revalidate = 3600;

// Allow new pages to work immediately (before rebuild)
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ locale: string; slug: string[] }>;
  searchParams: Promise<{ edit?: string }>;
}

// Pre-render all published pages
export async function generateStaticParams() {
  const provider = getContentProvider();
  const paths = await provider.getStaticPagePaths();

  // Filter out homepage (empty path) and format for catch-all
  return paths
    .filter((p) => p.path !== '')
    .map((p) => ({
      locale: p.locale,
      slug: p.path.split('/').filter(Boolean),
    }));
}

// Generate SEO metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const fullPath = slug.join('/');

  try {
    const provider = getContentProvider();
    const result = await provider.getPublishedPage(fullPath, locale);

    if (result?.page) {
      return generatePageMetadata(result.page, locale, config);
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }

  return generate404Metadata();
}

export default async function DynamicPage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  const { edit } = await searchParams;
  const fullPath = slug.join('/');
  const isEditMode = edit === 'true';

  try {
    const provider = getContentProvider();

    // In edit mode, get the page by path (including drafts)
    // In view mode, only get published pages
    const result = isEditMode
      ? await provider.getPageByPath(fullPath, locale)
      : await provider.getPublishedPage(fullPath, locale);

    if (result) {
      // Handle redirect if this is an old URL (skip in edit mode)
      if (result.redirectTo && !isEditMode) {
        redirect(result.redirectTo);
      }

      // Edit mode: render with editor wrapper
      if (isEditMode) {
        const site = await provider.getSite();
        return (
          <EditModePage
            page={result.page}
            headerConfig={site?.globals?.header}
            footerConfig={site?.globals?.footer}
          />
        );
      }

      // View mode: render blocks normally
      return <BlockRenderer blocks={result.page.blocks} />;
    }
  } catch (error) {
    console.error('Error loading page:', error);
  }

  // Page not found
  notFound();
}
