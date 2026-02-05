import type { Config } from 'tailwindcss';
import config from './astra.config';

const { tokens } = config;

// Helper to extract defined color values from palette
const extractPalette = (palette: Record<string, string | undefined>) => {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(palette)) {
    if (value) result[key] = value;
  }
  return result;
};

const tailwindConfig: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Primary brand colors - from astra.config.ts
        primary: extractPalette(tokens.colors.primaryPalette),
        // Secondary colors - from astra.config.ts
        secondary: extractPalette(tokens.colors.secondaryPalette),
        // Semantic colors - from astra.config.ts
        success: extractPalette(tokens.colors.successPalette),
        warning: extractPalette(tokens.colors.warningPalette),
        error: extractPalette(tokens.colors.errorPalette),
      },
      fontFamily: {
        sans: [tokens.typography.fontFamily.sans],
        heading: [tokens.typography.fontFamily.heading],
      },
      fontSize: tokens.typography.fontSize,
      borderRadius: tokens.radius,
      boxShadow: {
        ...tokens.shadows,
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      },
      spacing: {
        xs: `${tokens.spacing.xs}px`,
        sm: `${tokens.spacing.sm}px`,
        md: `${tokens.spacing.md}px`,
        lg: `${tokens.spacing.lg}px`,
        xl: `${tokens.spacing.xl}px`,
        '2xl': `${tokens.spacing['2xl']}px`,
        '3xl': `${tokens.spacing['3xl']}px`,
        '4xl': `${tokens.spacing['4xl']}px`,
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default tailwindConfig;
