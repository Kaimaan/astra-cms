/**
 * ONBOARDING: Basic Header implementation. Customize for your needs.
 *
 * This component renders the site header from SiteGlobals config.
 * Includes responsive mobile menu and sticky positioning.
 *
 * Remove this comment when you start building.
 */

import Link from 'next/link';
import { getContentProvider } from '@/infrastructure';
import { cn } from '@/lib/cn';
import type { HeaderConfig } from '@/core/content/types';
import { MobileMenu } from './MobileMenu';

async function getHeaderConfig(): Promise<HeaderConfig | null> {
  const provider = getContentProvider();
  const site = await provider.getSite();
  return site?.globals?.header ?? null;
}

export async function Header() {
  const config = await getHeaderConfig();

  if (!config) {
    return null;
  }

  const { logo, navigation, cta, sticky } = config;

  return (
    <header
      className={cn(
        'w-full bg-white border-b border-gray-200',
        sticky && 'sticky top-0 z-50'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            {logo?.href ? (
              <Link
                href={logo.href}
                className="flex items-center gap-2 font-semibold text-gray-900 hover:text-primary-600 transition-colors"
              >
                {logo.src ? (
                  <img src={logo.src} alt={logo.text || 'Logo'} className="h-8 w-auto" />
                ) : (
                  <span className="text-xl">{logo.text}</span>
                )}
              </Link>
            ) : (
              <div className="flex items-center gap-2 font-semibold text-gray-900">
                {logo?.src ? (
                  <img src={logo.src} alt={logo?.text || 'Logo'} className="h-8 w-auto" />
                ) : (
                  <span className="text-xl">{logo?.text}</span>
                )}
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-8">
            {navigation?.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {item.label}
              </Link>
            ))}

            {cta && (
              <Link
                href={cta.href}
                className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                {cta.label}
              </Link>
            )}
          </div>

          {/* Mobile menu */}
          <MobileMenu navigation={navigation} cta={cta} />
        </div>
      </nav>
    </header>
  );
}
