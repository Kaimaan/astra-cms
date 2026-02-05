'use client';

import type { BlockRendererProps } from '@/core/blocks/types';
import type { HeroProps } from './index';
import { cn } from '@/lib/cn';

const alignmentClasses = {
  left: 'text-left items-start',
  center: 'text-center items-center',
  right: 'text-right items-end',
};

export function HeroRenderer({ props, editMode }: BlockRendererProps<HeroProps>) {
  const { title, subtitle, description, alignment, cta, secondaryCta, backgroundImage } =
    props;

  return (
    <section
      className={cn(
        'relative py-24 px-4 md:py-32 lg:py-40',
        backgroundImage ? 'bg-cover bg-center' : 'bg-gray-50'
      )}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
    >
      {backgroundImage && (
        <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      )}

      <div
        className={cn(
          'relative mx-auto max-w-4xl flex flex-col gap-6',
          alignmentClasses[alignment || 'center']
        )}
      >
        {subtitle && (
          <p
            className={cn(
              'text-sm font-semibold uppercase tracking-wider',
              backgroundImage ? 'text-white/80' : 'text-primary-600'
            )}
          >
            {subtitle}
          </p>
        )}

        <h1
          className={cn(
            'text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl',
            backgroundImage ? 'text-white' : 'text-gray-900'
          )}
        >
          {title}
        </h1>

        {description && (
          <p
            className={cn(
              'max-w-2xl text-lg sm:text-xl',
              backgroundImage ? 'text-white/90' : 'text-gray-600'
            )}
          >
            {description}
          </p>
        )}

        {(cta || secondaryCta) && (
          <div className="flex flex-wrap gap-4 mt-4">
            {cta && (
              <a
                href={cta.href}
                className={cn(
                  'inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-colors',
                  cta.variant === 'primary' &&
                    'bg-primary-500 text-white hover:bg-primary-600',
                  cta.variant === 'secondary' &&
                    'bg-secondary-500 text-white hover:bg-secondary-600',
                  cta.variant === 'outline' &&
                    'border-2 border-primary-500 text-primary-500 hover:bg-primary-50'
                )}
              >
                {cta.label}
              </a>
            )}
            {secondaryCta && (
              <a
                href={secondaryCta.href}
                className={cn(
                  'inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-colors',
                  secondaryCta.variant === 'primary' &&
                    'bg-primary-500 text-white hover:bg-primary-600',
                  secondaryCta.variant === 'secondary' &&
                    'bg-secondary-500 text-white hover:bg-secondary-600',
                  secondaryCta.variant === 'outline' &&
                    (backgroundImage
                      ? 'border-2 border-white text-white hover:bg-white/10'
                      : 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50')
                )}
              >
                {secondaryCta.label}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
