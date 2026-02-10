'use client';

import DOMPurify from 'isomorphic-dompurify';
import type { BlockRendererProps } from '@/core/block-system/types';
import type { RichTextProps } from './index';
import { cn } from '@/lib/cn';

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
  full: 'max-w-none',
};

export function RichTextRenderer({ props, editMode }: BlockRendererProps<RichTextProps>) {
  const { content, maxWidth } = props;

  return (
    <section className="py-12 px-4 md:py-16">
      <div
        className={cn(
          'mx-auto prose prose-gray prose-lg',
          'prose-headings:font-bold prose-headings:tracking-tight',
          'prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline',
          'prose-img:rounded-lg',
          maxWidthClasses[maxWidth || 'md']
        )}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
      />
    </section>
  );
}
