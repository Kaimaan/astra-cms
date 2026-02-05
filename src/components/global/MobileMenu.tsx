'use client';

import { useState } from 'react';
import Link from 'next/link';

interface MobileMenuProps {
  navigation?: Array<{ label: string; href: string }>;
  cta?: { label: string; href: string };
}

export function MobileMenu({ navigation, cta }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="sr-only">{isOpen ? 'Close menu' : 'Open menu'}</span>
        {isOpen ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            {navigation?.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-base font-medium text-gray-600 hover:text-gray-900"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {cta && (
              <Link
                href={cta.href}
                className="block w-full text-center py-2 px-4 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
                onClick={() => setIsOpen(false)}
              >
                {cta.label}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
