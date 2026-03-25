/**
 * use-context-illustration.ts — Maps context names to illustration file paths.
 * Supports both French and English context names.
 * Uses the theme store to determine which illustration set (warm/daylight) to use.
 */
import { useThemeStore } from '~/stores/use-theme-store';

const CONTEXT_SLUGS: Record<string, string> = {
  'cuisine': 'kitchen',
  'kitchen': 'kitchen',
  'salon': 'living-room',
  'living room': 'living-room',
  'chambre': 'bedroom',
  'bedroom': 'bedroom',
  'salle de bain': 'bathroom',
  'bathroom': 'bathroom',
  'bureau': 'office',
  'office': 'office',
  'jardin': 'garden',
  'garden': 'garden',
  'voiture': 'car',
  'car': 'car',
  'global': 'house',
  'overall': 'house',
  'maison': 'house',
};

export function useContextIllustration() {
  const themeStore = useThemeStore();

  function getIllustrationPath(contextName: string, isGlobal: boolean): string {
    if (isGlobal) {
      return `${themeStore.illustrationBasePath}/house.webp`;
    }
    const slug = CONTEXT_SLUGS[contextName.toLowerCase()];
    if (slug) {
      return `${themeStore.illustrationBasePath}/${slug}.webp`;
    }
    return '/images/contexts/placeholder.webp';
  }

  return { getIllustrationPath };
}