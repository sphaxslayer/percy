/**
 * theme.client.ts — Client-only plugin that applies the persisted theme
 * on app startup. Sets data-theme on <html> from the Pinia theme store.
 */
import { useThemeStore } from '~/stores/use-theme-store';

export default defineNuxtPlugin(() => {
  const themeStore = useThemeStore();

  // Apply the persisted theme to <html> on startup
  document.documentElement.setAttribute('data-theme', themeStore.theme);
});