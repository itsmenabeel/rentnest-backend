// @ts-check
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default defineConfig([
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'postman/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': ['error', { allowAsImport: true }],
      'no-console': ['warn', { allow: ['error', 'warn'] }],
    },
  },
  {
    // Seed scripts legitimately print progress to stdout — not a code smell here.
    files: ['prisma/seed.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  eslintConfigPrettier,
]);
