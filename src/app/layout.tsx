import type { Metadata } from 'next';
import { getConfig } from '@/core/config';
import { getContentProvider } from '@/infrastructure';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfig();

  // Favicon: site.json (admin override) > astra.config.ts > /favicon.ico
  let favicon = config.site.favicon ?? '/favicon.ico';
  let appleTouchIcon = config.site.appleTouchIcon;
  try {
    const site = await getContentProvider().getSite();
    if (site?.favicon) favicon = site.favicon;
    if (site?.appleTouchIcon) appleTouchIcon = site.appleTouchIcon;
  } catch {
    // Content provider may not be available during build
  }

  return {
    title: {
      default: config.site.name,
      template: `%s | ${config.site.name}`,
    },
    description: config.site.description,
    icons: {
      icon: favicon,
      ...(appleTouchIcon && { apple: appleTouchIcon }),
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
