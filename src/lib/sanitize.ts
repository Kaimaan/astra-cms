/**
 * HTML Sanitization Utilities
 *
 * Sanitizes HTML content on write (API routes) to prevent stored XSS.
 * Renderer-side DOMPurify usage is kept as defense-in-depth.
 */

import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = [
  // Headings
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // Block elements
  'p', 'div', 'blockquote', 'pre', 'hr', 'br',
  // Lists
  'ul', 'ol', 'li',
  // Inline formatting
  'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins', 'mark', 'sub', 'sup', 'small',
  // Links & media
  'a', 'img',
  // Code
  'code', 'kbd', 'samp',
  // Tables
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  // Other
  'span', 'figure', 'figcaption', 'details', 'summary',
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel',
  'src', 'alt', 'width', 'height', 'loading',
  'class', 'id',
  'colspan', 'rowspan', 'scope',
  'open',
];

/**
 * Sanitize an HTML string, stripping dangerous tags/attributes.
 * Preserves legitimate rich-text formatting.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}

interface Block {
  type: string;
  props: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Walk a blocks array and sanitize HTML content in rich-text blocks.
 * Returns a new array (does not mutate the input).
 */
export function sanitizeBlockContent(blocks: unknown[]): unknown[] {
  return blocks.map((block) => {
    if (!isBlock(block)) return block;
    if (block.type !== 'rich-text') return block;

    const content = block.props?.content;
    if (typeof content !== 'string') return block;

    return {
      ...block,
      props: {
        ...block.props,
        content: sanitizeHtml(content),
      },
    };
  });
}

function isBlock(value: unknown): value is Block {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as Block).type === 'string'
  );
}
