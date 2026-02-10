'use client';

import type { BlockRendererProps } from '@/core/block-system/types';
import type { FeaturesProps } from './index';
import { cn } from '@/lib/cn';
import * as LucideIcons from 'lucide-react';

const columnClasses = {
  '2': 'md:grid-cols-2',
  '3': 'md:grid-cols-2 lg:grid-cols-3',
  '4': 'md:grid-cols-2 lg:grid-cols-4',
};

// Get a Lucide icon component by name
function getIconComponent(name: string): LucideIcons.LucideIcon | null {
  const icons = LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>;
  return icons[name] || null;
}

export function FeaturesRenderer({ props, editMode }: BlockRendererProps<FeaturesProps>) {
  const { title, subtitle, features, columns } = props;

  return (
    <section className="py-16 px-4 md:py-24">
      <div className="mx-auto max-w-6xl">
        {(title || subtitle) && (
          <div className="text-center mb-12 md:mb-16">
            {subtitle && (
              <p className="text-sm font-semibold uppercase tracking-wider text-primary-600 mb-2">
                {subtitle}
              </p>
            )}
            {title && (
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {title}
              </h2>
            )}
          </div>
        )}

        <div className={cn('grid grid-cols-1 gap-8', columnClasses[columns || '3'])}>
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
            >
              {feature.icon && (() => {
                const IconComponent = getIconComponent(feature.icon);
                return (
                  <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary-100 text-primary-600 mb-4">
                    {IconComponent ? <IconComponent className="w-6 h-6" /> : <span className="text-2xl">✦</span>}
                  </div>
                );
              })()}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
