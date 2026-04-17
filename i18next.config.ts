import { defineConfig } from 'i18next-cli';

export default defineConfig({
  locales: ['en', 'ko'],
  extract: {
    input: ['src/**/*.{js,jsx,ts,tsx}'],
    ignore: [
      '**/*.test.*',
      '**/*.spec.*',
      '**/*.stories.*',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**'
    ],
    defaultNS: 'common',
    output: 'src/i18n/{{language}}/{{namespace}}.json',
    keySeparator: false,
    nsSeparator: ':',
    functions: ['t'],
    removeUnusedKeys: false,
  },
  
  types: {
    input: [
      'src/i18n/*/*.json'
    ],
    output: 'src/types/i18next.d.ts',
  }
});
