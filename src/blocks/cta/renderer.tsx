'use client';

import type { BlockRendererProps } from '@/core/block-system/types';
import type { CTAProps } from './index';
import { cn } from '@/lib/cn';

export function CTARenderer({ props, editMode }: BlockRendererProps<CTAProps>) {
  const { title, description, cta, secondaryCta, variant } = props;

  const isHighlighted = variant === 'highlighted';

  return (
    <section
      className={cn(
        'py-16 px-4 md:py-24',
        isHighlighted ? 'bg-primary-600' : 'bg-gray-50'
      )}
    >
      <div className="mx-auto max-w-4xl text-center">
        <h2
          className={cn(
            'text-3xl font-bold tracking-tight sm:text-4xl',
            isHighlighted ? 'text-white' : 'text-gray-900'
          )}
        >
          {title}
        </h2>

        {description && (
          <p
            className={cn(
              'mt-4 text-lg',
              isHighlighted ? 'text-primary-100' : 'text-gray-600'
            )}
          >
            {description}
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a
            href={cta.href}
            className={cn(
              'inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-colors',
              isHighlighted
                ? 'bg-white text-primary-600 hover:bg-gray-100'
                : cta.variant === 'primary'
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : cta.variant === 'secondary'
                    ? 'bg-secondary-500 text-white hover:bg-secondary-600'
                    : 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50'
            )}
          >
            {cta.label}
          </a>

          {secondaryCta && (
            <a
              href={secondaryCta.href}
              className={cn(
                'inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-colors',
                isHighlighted
                  ? 'border-2 border-white text-white hover:bg-white/10'
                  : 'border-2 border-gray-300 text-gray-700 hover:bg-gray-100'
              )}
            >
              {secondaryCta.label}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
