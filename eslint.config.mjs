/**
 * eslint.config.mjs — ESLint flat config for Nuxt 3 + Vue 3 + TypeScript.
 * Uses @nuxt/eslint for Nuxt-aware rules and prettier integration.
 */
import withNuxt from './.nuxt/eslint.config.mjs';
import eslintConfigPrettier from 'eslint-config-prettier';

export default withNuxt(
  // Prettier config — disables ESLint rules that conflict with Prettier
  eslintConfigPrettier,
  {
    rules: {
      // Allow console in development files (server utils, dev scripts)
      // For production code, prefer proper logging
      'no-console': 'warn',
      // Enforce consistent Vue component naming
      'vue/multi-word-component-names': 'off', // shadcn components are single-word
    },
  },
);
