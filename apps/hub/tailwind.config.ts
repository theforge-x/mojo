import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', '../../libs/shared/ui/src/**/*.{ts,tsx}', '../../libs/*/src/feature/**/*.tsx'],
  presets: [],
} satisfies Config;
