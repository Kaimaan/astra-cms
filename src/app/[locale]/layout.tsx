import { getHtmlLang, isValidLocale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';

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
    <html lang={getHtmlLang(locale)}>
      <body>
        {/* TODO: Add Header global component */}
        <main>{children}</main>
        {/* TODO: Add Footer global component */}
      </body>
    </html>
  );
}
