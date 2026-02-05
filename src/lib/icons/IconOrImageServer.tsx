/**
 * Server Icon/Image Component
 *
 * Server-side version of IconOrImage that renders icons as inline SVG.
 * This avoids bundling all Lucide icons in the client bundle.
 */

import Image from 'next/image';
import { cn } from '@/lib/cn';
import {
  lucideIcons,
  semanticToEmojiMap,
  emojiToSemanticMap,
  legacyNameAliases,
} from './mappings';
import type { SemanticIconName, IconLibrary } from './types';
import { ServerIcon } from './ServerIcon';

export type IconSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;

interface IconOrImageServerProps {
  value: string;
  iconLibrary?: IconLibrary;
  alt?: string;
  className?: string;
  imageClassName?: string;
  size?: IconSize;
}

// Responsive size classes for image icons
const sizeClasses: Record<string, string> = {
  sm: 'w-8 h-8 sm:w-10 sm:h-10',
  md: 'w-10 h-10 sm:w-12 sm:h-12',
  lg: 'w-12 h-12 sm:w-14 sm:h-14',
  xl: 'w-14 h-14 sm:w-16 sm:h-16',
  '2xl': 'w-16 h-16 sm:w-20 sm:h-20',
};

// Icon pixel sizes
const iconSizes: Record<string, number> = {
  sm: 24,
  md: 32,
  lg: 40,
  xl: 48,
  '2xl': 56,
};

// Emoji/text icon styles
const emojiStyleClasses: Record<string, string> = {
  sm: 'text-xl sm:text-2xl',
  md: 'text-2xl sm:text-3xl',
  lg: 'text-3xl sm:text-4xl',
  xl: 'text-4xl sm:text-5xl',
  '2xl': 'text-5xl sm:text-6xl',
};

/**
 * Resolve icon name to semantic name or return null
 */
function resolveIconName(input: string): SemanticIconName | null {
  if (!input) return null;

  // Check if it's an emoji
  const emojiMatch = emojiToSemanticMap[input];
  if (emojiMatch) return emojiMatch;

  // Normalize to lowercase
  const normalized = input.toLowerCase().trim();

  // Check if it's already a semantic name
  if (normalized in lucideIcons) {
    return normalized as SemanticIconName;
  }

  // Check legacy/alias names
  const aliasMatch = legacyNameAliases[normalized];
  if (aliasMatch) return aliasMatch;

  return null;
}

/**
 * Get emoji for a given name
 */
function getEmoji(name: string): string | null {
  if (emojiToSemanticMap[name]) return name;
  const semanticName = resolveIconName(name);
  if (!semanticName) return null;
  return semanticToEmojiMap[semanticName] || null;
}

/**
 * Server-side version of IconOrImage.
 * Renders icons as inline SVG, avoiding client-side icon library bundling.
 */
export function IconOrImageServer({
  value,
  iconLibrary = 'lucide',
  alt = '',
  className,
  imageClassName,
  size = 'lg',
}: IconOrImageServerProps) {
  if (!value) return null;

  const library = iconLibrary;

  const isUrl =
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('/');

  // Handle URLs - render as Image
  if (isUrl) {
    const sizeStyle =
      typeof size === 'number' ? { width: size, height: size } : undefined;
    const sizeClass =
      typeof size === 'string' ? sizeClasses[size] || sizeClasses.lg : '';

    return (
      <div
        className={cn('relative flex-shrink-0', sizeClass, className)}
        style={sizeStyle}
      >
        <Image
          src={value}
          alt={alt}
          fill
          className={cn('object-contain', imageClassName)}
          unoptimized={value.startsWith('http')}
        />
      </div>
    );
  }

  // Handle emoji library - render emoji character
  if (library === 'emoji') {
    const emoji = getEmoji(value);
    const emojiStyleClass =
      typeof size === 'string'
        ? emojiStyleClasses[size] || emojiStyleClasses.lg
        : '';

    return (
      <span
        className={cn(emojiStyleClass, 'flex-shrink-0', className)}
        role="img"
        aria-label={alt || value}
      >
        {emoji || value}
      </span>
    );
  }

  // Calculate icon size
  const iconSize = typeof size === 'number' ? size : iconSizes[size] || 40;

  // Try curated icons first (these are imported individually and tree-shaken)
  const semanticName = resolveIconName(value);
  if (semanticName) {
    const CuratedIcon = lucideIcons[semanticName];
    if (CuratedIcon) {
      return (
        <CuratedIcon
          size={iconSize}
          className={cn('flex-shrink-0', className)}
          aria-label={alt || value}
        />
      );
    }
  }

  // Fall back to ServerIcon for non-curated icons (renders from registry)
  // ServerIcon expects PascalCase name (e.g., "Globe2", "ShoppingCart")
  return (
    <ServerIcon
      name={value}
      size={iconSize}
      className={cn('flex-shrink-0', className)}
    />
  );
}

export default IconOrImageServer;
