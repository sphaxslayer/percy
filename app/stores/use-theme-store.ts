/**
 * use-theme-store.ts — Persisted Pinia store for Percy theme preferences.
 * Manages the active color theme (terracotta | saphir) and illustration set (warm | daylight).
 * The theme is applied as a data-theme attribute on <html> so CSS variables resolve correctly.
 * Dark/light mode is handled separately by @nuxtjs/color-mode.
 */

export type ThemeName = 'terracotta' | 'saphir';
export type IllustrationSet = 'warm' | 'daylight';

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeName>('terracotta');
  const illustrationSet = ref<IllustrationSet>('warm');

  /** Base path for context illustrations (e.g. /images/contexts/warm) */
  const illustrationBasePath = computed(() => `/images/contexts/${illustrationSet.value}`);

  function setTheme(t: ThemeName) {
    theme.value = t;
    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', t);
    }
  }

  function setIllustrationSet(s: IllustrationSet) {
    illustrationSet.value = s;
  }

  return {
    theme,
    illustrationSet,
    illustrationBasePath,
    setTheme,
    setIllustrationSet,
  };
}, {
  persist: true,
});