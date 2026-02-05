'use client';

import Image from 'next/image';
import { cn } from '@/lib/cn';
import { useIconLibrary } from './IconProvider';

export type IconSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;

interface IconOrImageProps {
  value: string;
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
 * Renders an icon or image based on the value.
 * - If value is a URL → renders as Image
 * - If library is 'emoji' → renders emoji character
 * - If value matches a known icon name → renders from selected library
 * - Otherwise → renders as text/emoji fallback
 */
export function IconOrImage({
  value,
  alt = '',
  className,
  imageClassName,
  size = 'lg',
}: IconOrImageProps) {
  const { library, getIcon, getEmoji } = useIconLibrary();

  if (!value) return null;

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

  // Try to get icon from the current library
  const IconComponent = getIcon(value);

  if (IconComponent) {
    const iconSize = typeof size === 'number' ? size : iconSizes[size] || 40;

    return (
      <IconComponent
        size={iconSize}
        className={cn('flex-shrink-0', className)}
        aria-label={alt || value}
      />
    );
  }

  // Fallback: render as emoji/text
  const emojiStyleClass =
    typeof size === 'string'
      ? emojiStyleClasses[size] || emojiStyleClasses.lg
      : '';
  return (
    <span
      className={cn(emojiStyleClass, 'flex-shrink-0', className)}
      role="img"
      aria-label={alt || 'icon'}
    >
      {value}
    </span>
  );
}

export default IconOrImage;
