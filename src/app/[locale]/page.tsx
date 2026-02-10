import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlockRenderer } from '@/components/BlockRenderer';
import { EditModePage } from '@/components/editor';
import { getContentProvider } from '@/infrastructure';
import { generatePageMetadata } from '@/lib/seo/metadata';
import config from '../../../astra.config';

// ISR: revalidate every hour (can be overridden by on-demand revalidation)
export const revalidate = 3600;

// Allow dynamic locales (geo-detected like en-FI, en-US)
export const dynamicParams = true;

interface HomePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ edit?: string }>;
}

// Pre-render for all configured locales
export async function generateStaticParams() {
  return config.i18n.locales.map((locale) => ({ locale }));
}

// Generate SEO metadata
export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;

  try {
    const provider = getContentProvider();
    const result = await provider.getPublishedPage('', locale);

    if (result?.page) {
      return generatePageMetadata(result.page, locale, config);
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }

  // Fallback metadata
  return {
    title: config.site.name,
    description: config.site.description,
  };
}

export default async function HomePage({ params, searchParams }: HomePageProps) {
  const { locale } = await params;
  const { edit } = await searchParams;
  const isEditMode = edit === 'true';

  try {
    const provider = getContentProvider();

    // In edit mode, get the page by path (including drafts)
    // In view mode, only get published pages
    const result = isEditMode
      ? await provider.getPageByPath('', locale)
      : await provider.getPublishedPage('', locale);

    if (result?.page) {
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
    console.error('Error loading homepage:', error);
  }

  // No homepage exists - return 404
  notFound();
}
