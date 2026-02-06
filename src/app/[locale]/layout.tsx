/**
 * ONBOARDING: This layout renders Header and Footer from site.json config.
 *
 * Customize Header/Footer in src/components/global/ or update content/site.json.
 *
 * Remove this comment when you start building.
 */

import { getHtmlLang, isValidLocale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';
import { Header, Footer } from '@/components/global';

// Allow dynamic locale params (country-language combos like fi-en, de-en)
export const dynamicParams = true;

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale format and language support
  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
