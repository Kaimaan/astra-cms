'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import type { IconLibrary, SemanticIconName } from './types';
import {
  lucideIcons,
  semanticToEmojiMap,
  emojiToSemanticMap,
  legacyNameAliases,
} from './mappings';

interface IconContextValue {
  library: IconLibrary;
  getIcon: (name: string) => LucideIcon | null;
  getEmoji: (name: string) => string | null;
  resolveIconName: (input: string) => SemanticIconName | null;
}

const IconContext = createContext<IconContextValue | null>(null);

/**
 * Resolve any icon input to a semantic icon name.
 * Handles: emoji, semantic names, legacy aliases, PascalCase Lucide names.
 */
function resolveIconName(input: string): SemanticIconName | null {
  if (!input) return null;

  // Check if it's an emoji
  if (emojiToSemanticMap[input]) {
    return emojiToSemanticMap[input];
  }

  // Normalize to lowercase for lookup
  const normalized = input.toLowerCase().trim();

  // Check if it's already a semantic name
  if (normalized in lucideIcons) {
    return normalized as SemanticIconName;
  }

  // Check legacy aliases (includes PascalCase Lucide names)
  if (legacyNameAliases[input]) {
    return legacyNameAliases[input];
  }

  // Try lowercase version of legacy aliases
  if (legacyNameAliases[normalized]) {
    return legacyNameAliases[normalized];
  }

  return null;
}

interface IconProviderProps {
  children: ReactNode;
  library?: IconLibrary;
}

export function IconProvider({ children, library = 'lucide' }: IconProviderProps) {
  const getIcon = (name: string): LucideIcon | null => {
    const resolved = resolveIconName(name);
    if (resolved && lucideIcons[resolved]) {
      return lucideIcons[resolved];
    }
    return null;
  };

  const getEmoji = (name: string): string | null => {
    const resolved = resolveIconName(name);
    if (resolved && semanticToEmojiMap[resolved]) {
      return semanticToEmojiMap[resolved];
    }
    return null;
  };

  return (
    <IconContext.Provider
      value={{
        library,
        getIcon,
        getEmoji,
        resolveIconName,
      }}
    >
      {children}
    </IconContext.Provider>
  );
}

export function useIconLibrary(): IconContextValue {
  const context = useContext(IconContext);

  // Fallback for usage outside provider
  if (!context) {
    return {
      library: 'lucide',
      getIcon: (name: string) => {
        const resolved = resolveIconName(name);
        return resolved ? lucideIcons[resolved] : null;
      },
      getEmoji: (name: string) => {
        const resolved = resolveIconName(name);
        return resolved ? semanticToEmojiMap[resolved] : null;
      },
      resolveIconName,
    };
  }

  return context;
}
