# Design System — Percy

## Role Context
When Claude reads this file, it should think as a **Senior UI Designer / Design System Engineer**.
Focus: visual consistency, theming, tokens, accessibility, illustrations.

## Typography

### Font
- **Primary**: Quicksand (Google Fonts)
- **Weights**: 400 (body), 500 (labels), 600 (emphasis), 700 (headings, buttons)
- **Fallback**: system-ui, -apple-system, sans-serif

### Scale
| Usage | Size | Weight | Line-height |
|-------|------|--------|-------------|
| Page title (h1) | 24px / 1.5rem | 700 | 1.3 |
| Section title (h2) | 18px / 1.125rem | 700 | 1.4 |
| Card title (h3) | 15px / 0.9375rem | 700 | 1.4 |
| Body | 14px / 0.875rem | 400 | 1.6 |
| Small / caption | 12px / 0.75rem | 500 | 1.5 |
| Tiny (badges) | 11px / 0.6875rem | 700 | 1.4 |

### Import
```css
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap');
```

In `nuxt.config.ts`:
```typescript
app: {
  head: {
    link: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap' }
    ]
  }
}
```

In `tailwind.config.ts`:
```typescript
theme: {
  extend: {
    fontFamily: {
      sans: ['Quicksand', 'system-ui', '-apple-system', 'sans-serif'],
    },
  },
}
```

## Themes

Percy supports two themes. The user selects their preferred theme in Settings.
Both themes support light and dark mode (4 combinations total).

### Theme 1: Terracotta & Sauge
Warm, earthy, reassuring — like a well-decorated home.

#### Light Mode Tokens
```css
[data-theme="terracotta"] {
  /* Primary */
  --percy-primary: #C4653A;
  --percy-primary-hover: #B3572E;
  --percy-primary-light: #FCEEE6;
  --percy-primary-text: #FFF8F2;

  /* Secondary */
  --percy-secondary: #8A9A5B;
  --percy-secondary-hover: #7A894E;
  --percy-secondary-light: #EEF1E6;
  --percy-secondary-text: #F5F7F0;

  /* Accent */
  --percy-accent: #B8860B;
  --percy-accent-light: #FFF3D6;
  --percy-accent-text: #7A5A08;

  /* Neutrals */
  --percy-bg-page: #FBF7F2;
  --percy-bg-card: #FFFFFF;
  --percy-bg-sidebar: #FAF5EE;
  --percy-bg-nav: #F0EAE0;
  --percy-bg-input: #FFFCF8;
  --percy-border: #E8DDD0;
  --percy-border-input: #D9CEBD;
  --percy-text-primary: #2A2218;
  --percy-text-secondary: #6B5E50;
  --percy-text-muted: #8A7B6B;
  --percy-progress-bg: #EDE6DB;
  --percy-progress-fill: linear-gradient(90deg, #C4653A, #D4844E);
}
```

#### Dark Mode Tokens
```css
[data-theme="terracotta"].dark {
  --percy-primary: #D4844E;
  --percy-primary-hover: #E89868;
  --percy-primary-light: #3A2218;
  --percy-primary-text: #FFF8F2;

  --percy-secondary: #A4B87A;
  --percy-secondary-hover: #B8CC8E;
  --percy-secondary-light: #1E2418;
  --percy-secondary-text: #F5F7F0;

  --percy-accent: #D4A836;
  --percy-accent-light: #2E2410;
  --percy-accent-text: #D4A836;

  --percy-bg-page: #1A1612;
  --percy-bg-card: #2A2218;
  --percy-bg-sidebar: #221E18;
  --percy-bg-nav: #2A2218;
  --percy-bg-input: #2A2218;
  --percy-border: #3D3228;
  --percy-border-input: #3D3228;
  --percy-text-primary: #F0E8DA;
  --percy-text-secondary: #C4B8A6;
  --percy-text-muted: #A69882;
  --percy-progress-bg: #3D3228;
  --percy-progress-fill: linear-gradient(90deg, #D4844E, #E8A870);
}
```

### Theme 2: Saphir, Améthyste & Or
Elegant, deep, tech but warm — with violet accents and gold highlights.

#### Light Mode Tokens
```css
[data-theme="saphir"] {
  /* Primary */
  --percy-primary: #3566A8;
  --percy-primary-hover: #2A5590;
  --percy-primary-light: #E0EAF6;
  --percy-primary-text: #EAF0FF;

  /* Secondary (violet accent) */
  --percy-secondary: #7A68B8;
  --percy-secondary-hover: #6A58A0;
  --percy-secondary-light: #EDE8F5;
  --percy-secondary-text: #F4F0FF;

  /* Accent (gold) */
  --percy-accent: #C9A033;
  --percy-accent-light: #FBF4E2;
  --percy-accent-text: #7A6520;

  /* Neutrals */
  --percy-bg-page: #F4F7FC;
  --percy-bg-card: #FFFFFF;
  --percy-bg-sidebar: #F0F4FB;
  --percy-bg-nav: #E4ECF4;
  --percy-bg-input: #FAFCFF;
  --percy-border: #C4D4EC;
  --percy-border-input: #C4D4EC;
  --percy-text-primary: #1A2A40;
  --percy-text-secondary: #506880;
  --percy-text-muted: #6888A8;
  --percy-progress-bg: #CED8EA;
  --percy-progress-fill: linear-gradient(90deg, #3566A8, #5A8AD0);
}
```

#### Dark Mode Tokens
```css
[data-theme="saphir"].dark {
  --percy-primary: #5A8AD0;
  --percy-primary-hover: #78A8E0;
  --percy-primary-light: #142240;
  --percy-primary-text: #EAF0FF;

  --percy-secondary: #9A88D0;
  --percy-secondary-hover: #B0A0E0;
  --percy-secondary-light: #1E1838;
  --percy-secondary-text: #F4F0FF;

  --percy-accent: #DABA55;
  --percy-accent-light: #2A2410;
  --percy-accent-text: #DABA55;

  --percy-bg-page: #0C1420;
  --percy-bg-card: #14202E;
  --percy-bg-sidebar: #101824;
  --percy-bg-nav: #14202E;
  --percy-bg-input: #14202E;
  --percy-border: #1E3450;
  --percy-border-input: #1E3450;
  --percy-text-primary: #E0ECF4;
  --percy-text-secondary: #8AB0D0;
  --percy-text-muted: #6890B0;
  --percy-progress-bg: #1E3450;
  --percy-progress-fill: linear-gradient(90deg, #5A8AD0, #78A8E0);
}
```

## Semantic Colors (shared across themes)

These don't change with theme — they communicate universal meaning.

```css
:root {
  --percy-success: #3A7A3A;
  --percy-success-light: #E6F2E6;
  --percy-warning: #B8860B;
  --percy-warning-light: #FFF3D6;
  --percy-danger: #C04040;
  --percy-danger-light: #FCEAEA;
  --percy-info: #3566A8;
  --percy-info-light: #E0EAF6;
}

.dark {
  --percy-success: #70C070;
  --percy-success-light: #142014;
  --percy-warning: #D4A836;
  --percy-warning-light: #2E2410;
  --percy-danger: #E07070;
  --percy-danger-light: #2A1414;
  --percy-info: #78B0E0;
  --percy-info-light: #142240;
}
```

## Priority Colors

Used for task priorities in TodoAtHome and other skills:

| Priority | Light | Dark | Usage |
|----------|-------|------|-------|
| Low | #3A7A3A on #E6F2E6 | #70C070 on #142014 | Badge, progress, agenda dot |
| Normal | #B8860B on #FFF3D6 | #D4A836 on #2E2410 | Badge, progress, agenda dot |
| High | #C04040 on #FCEAEA | #E07070 on #2A1414 | Badge, progress, agenda dot |

## Spacing & Layout

Based on a 4px grid:
```css
:root {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;
  --space-2xl: 32px;
  --space-3xl: 48px;
}
```

### Border Radius
```css
:root {
  --radius-sm: 6px;    /* badges, small buttons */
  --radius-md: 8px;    /* buttons, inputs, nav items */
  --radius-lg: 12px;   /* cards, sidebar, modals */
  --radius-xl: 16px;   /* large containers, page sections */
}
```

### Shadows (minimal — used sparingly)
```css
:root {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.10);
}
.dark {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.4);
}
```

## Component Patterns

### Buttons
```html
<!-- Primary -->
<button class="bg-percy-primary text-percy-primary-text hover:bg-percy-primary-hover font-bold text-sm px-4 py-2 rounded-md transition-colors">
  Ajouter
</button>

<!-- Secondary -->
<button class="bg-percy-secondary text-percy-secondary-text ...">
  Détails
</button>

<!-- Gold / Accent (confirmation actions) -->
<button class="bg-percy-accent text-white ...">
  Valider
</button>

<!-- Outline -->
<button class="border border-percy-primary text-percy-primary bg-transparent hover:bg-percy-primary-light ...">
  Modifier
</button>

<!-- Ghost -->
<button class="border border-percy-border text-percy-text-muted bg-transparent hover:bg-percy-bg-nav ...">
  Annuler
</button>
```

### Cards (context cards, skill cards)
```html
<div class="bg-percy-bg-card border border-percy-border rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer">
  <!-- Card content -->
</div>
```

Active/selected card uses primary color as background:
```html
<div class="bg-percy-primary text-percy-primary-text rounded-lg p-3">
  <!-- Highlighted card -->
</div>
```

### Badges
```html
<span class="bg-percy-primary-light text-percy-primary text-xs font-bold px-2.5 py-0.5 rounded-md">
  3 ouvertes
</span>
```

### Progress Bars
```html
<div class="h-1.5 rounded-full bg-percy-progress-bg overflow-hidden">
  <div class="h-full rounded-full" style="width: 40%; background: var(--percy-progress-fill)"></div>
</div>
```

### Navigation (pill tabs)
```html
<nav class="inline-flex gap-0.5 bg-percy-bg-nav rounded-lg p-0.5">
  <button class="px-3 py-1.5 rounded-md text-xs font-bold bg-percy-primary text-percy-primary-text">
    Dashboard
  </button>
  <button class="px-3 py-1.5 rounded-md text-xs font-bold text-percy-text-muted hover:bg-percy-bg-card">
    Courses
  </button>
</nav>
```

### Sidebar
```html
<aside class="bg-percy-bg-sidebar border-r border-percy-border p-3 rounded-lg">
  <nav class="space-y-1">
    <a class="flex items-center gap-2 px-2.5 py-2 rounded-md text-sm font-semibold bg-percy-primary text-percy-primary-text">
      🏠 Dashboard
    </a>
    <a class="flex items-center gap-2 px-2.5 py-2 rounded-md text-sm font-semibold text-percy-text-secondary hover:bg-percy-bg-nav">
      🛒 Courses
    </a>
  </nav>
</aside>
```

### Inputs
```html
<input class="w-full px-3 py-2 rounded-md border border-percy-border-input bg-percy-bg-input text-percy-text-primary text-sm placeholder:text-percy-text-muted focus:outline-none focus:ring-2 focus:ring-percy-primary/30 focus:border-percy-primary transition-colors"
  placeholder="Ajouter un produit...">
```

### Gold Divider (Saphir theme accent)
```html
<hr class="h-0.5 border-0 rounded-sm bg-gradient-to-r from-transparent via-percy-accent to-transparent my-6">
```
For Terracotta theme, this becomes a warm gradient:
```html
<hr class="h-0.5 border-0 rounded-sm bg-gradient-to-r from-transparent via-percy-primary to-transparent my-6">
```

## Dark Mode Implementation

Use Nuxt's `useColorMode()` composable from `@nuxtjs/color-mode` module.

```typescript
// nuxt.config.ts
modules: ['@nuxtjs/color-mode'],
colorMode: {
  classSuffix: '',        // adds 'dark' class to <html>, not 'dark-mode'
  preference: 'system',   // respect OS preference by default
  fallback: 'light',
}
```

Theme and illustration set are stored in a Pinia store and persisted:
```typescript
// stores/use-theme-store.ts
export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: 'terracotta' as 'terracotta' | 'saphir',
    illustrationSet: 'warm' as 'warm' | 'daylight',
  }),
  actions: {
    setTheme(t: 'terracotta' | 'saphir') {
      this.theme = t
      document.documentElement.setAttribute('data-theme', t)
    },
    setIllustrationSet(s: 'warm' | 'daylight') {
      this.illustrationSet = s
    },
  },
  getters: {
    // Returns the base path for context illustrations
    illustrationBasePath: (state) => `/images/contexts/${state.illustrationSet}`,
  },
  persist: true,
})
```

Theme and illustration set are independent: any combination is valid (e.g. Terracotta theme + daylight illustrations, or Saphir theme + warm illustrations). The user configures both in Settings.

## Illustrations — Isometric Style for Context Cards

### Style Definition
Illustrations for context cards (rooms, garden, car, etc.) use an isometric style:
- Isometric perspective (~30° angle)
- Soft, rounded shapes — NOT angular pixel art
- Subtle textures (wood grain, fabric weave) but not overly detailed
- Muted, natural colors
- NO people. Objects and furniture only.
- Adult, refined aesthetic — cozy but not childish. Think "Studio Ghibli meets architectural illustration", not "Animal Crossing".
- Each illustration: pick the best variant, export as WebP, ideally ~100-150 KB
- Background: black (will be displayed on cards with rounded corners and overflow hidden)

### Two Illustration Sets
Percy offers two sets of illustrations. The user picks their preferred set independently of the color theme.

**Set "warm"**: Amber/golden hour lighting, rich warm tones. Feels like a cozy autumn evening.
**Set "daylight"**: Neutral cool studio lighting, daylight white balance (~6500K). Feels clean and airy.

### File Structure
```
public/images/contexts/
├── warm/                      ← amber/golden set
│   ├── kitchen.webp
│   ├── living-room.webp
│   ├── bedroom.webp
│   ├── bathroom.webp
│   ├── office.webp
│   ├── garden.webp
│   ├── car.webp
│   └── house.webp             ← global/overall context
├── daylight/                  ← neutral/cool daylight set
│   ├── kitchen.webp
│   ├── living-room.webp
│   ├── bedroom.webp
│   ├── bathroom.webp
│   ├── office.webp
│   ├── garden.webp
│   ├── car.webp
│   └── house.webp
└── placeholder.webp           ← fallback for user-created custom contexts
```

One image per context per set. When generating via Sora, pick the best of the 4 variants.

### Context-to-Filename Mapping
The TodoContext model has a `name` field (user-editable). To map to an illustration file, use a slug lookup:

```typescript
// composables/use-context-illustration.ts
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
}

export function useContextIllustration() {
  const themeStore = useThemeStore()

  function getIllustrationPath(contextName: string, isGlobal: boolean): string {
    if (isGlobal) {
      return `${themeStore.illustrationBasePath}/house.webp`
    }
    const slug = CONTEXT_SLUGS[contextName.toLowerCase()]
    if (slug) {
      return `${themeStore.illustrationBasePath}/${slug}.webp`
    }
    return '/images/contexts/placeholder.webp'
  }

  return { getIllustrationPath }
}
```

### ContextIllustration Component
```vue
<!-- components/ui/ContextIllustration.vue -->
<script setup lang="ts">
const props = defineProps<{
  contextName: string
  isGlobal?: boolean
  icon?: string        // emoji fallback
  color?: string       // hex color fallback
}>()

const { getIllustrationPath } = useContextIllustration()
const src = computed(() => getIllustrationPath(props.contextName, props.isGlobal ?? false))
const hasError = ref(false)
</script>

<template>
  <!-- Show illustration if available, fallback to colored box with emoji -->
  <div class="w-full h-full rounded-lg overflow-hidden">
    <img
      v-if="!hasError"
      :src="src"
      :alt="contextName"
      class="w-full h-full object-cover"
      @error="hasError = true"
    >
    <div
      v-else
      class="w-full h-full flex items-center justify-center text-4xl"
      :style="{ backgroundColor: color || 'var(--percy-bg-nav)' }"
    >
      {{ icon || '📋' }}
    </div>
  </div>
</template>
```

### Sora Prompts (reference)

**Base prefix — warm set:**
```
Isometric illustration, warm soft lighting, rounded gentle shapes, muted natural
color palette, cozy refined aesthetic, no people, studio ghibli meets architectural
illustration style, subtle textures, black background, 400x300px --style raw
```

**Base prefix — daylight set:**
```
Isometric illustration, clean neutral studio lighting with soft cool daylight,
rounded gentle shapes, muted natural color palette with cool undertones, refined
cozy aesthetic, no people, studio ghibli meets architectural illustration style,
subtle textures, black background, 400x300px, color temperature 6500K daylight
white --style raw
```

**Per-context suffixes** (append to the chosen base prefix):

| Context | Suffix |
|---------|--------|
| Kitchen | a kitchen scene with a wooden countertop, copper pots, a cutting board with vegetables, a ceramic fruit bowl, tile backsplash, a small herb pot by the window, steam rising from a kettle |
| Living room | a comfortable living room with a soft sofa with throw pillows, a round coffee table with a book and mug, a reading lamp, a small rug, a potted plant, light through curtains |
| Bedroom | a peaceful bedroom with a neatly made bed with linen sheets, bedside table with a small lamp and book, a soft rug, folded blanket, a small plant on the windowsill |
| Bathroom | a clean bathroom scene with a freestanding sink, folded towels, a small mirror, soap dispenser, a tiny succulent, ceramic tiles in soft colors |
| Office | a tidy home office with a wooden desk, a closed laptop, a desk lamp, a coffee cup, a small stack of notebooks, a pen holder, natural light from a side window |
| Garden | a small garden scene with raised wooden planter boxes, garden tools leaning against a wall, watering can, small potted herbs, a garden path with stepping stones |
| Car | a car in a driveway scene, compact hatchback from isometric view, a clean garage entrance, a toolbox nearby, garden visible in background |
| House (global) | a cozy house exterior from isometric view, front door slightly open, light spilling out, a welcome mat, a small potted plant by the door, mailbox |

## Tailwind Configuration Summary

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './app/**/*.{vue,ts}',
    './components/**/*.{vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Quicksand', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        percy: {
          primary: 'var(--percy-primary)',
          'primary-hover': 'var(--percy-primary-hover)',
          'primary-light': 'var(--percy-primary-light)',
          'primary-text': 'var(--percy-primary-text)',
          secondary: 'var(--percy-secondary)',
          'secondary-hover': 'var(--percy-secondary-hover)',
          'secondary-light': 'var(--percy-secondary-light)',
          'secondary-text': 'var(--percy-secondary-text)',
          accent: 'var(--percy-accent)',
          'accent-light': 'var(--percy-accent-light)',
          'accent-text': 'var(--percy-accent-text)',
          'bg-page': 'var(--percy-bg-page)',
          'bg-card': 'var(--percy-bg-card)',
          'bg-sidebar': 'var(--percy-bg-sidebar)',
          'bg-nav': 'var(--percy-bg-nav)',
          'bg-input': 'var(--percy-bg-input)',
          border: 'var(--percy-border)',
          'border-input': 'var(--percy-border-input)',
          'text-primary': 'var(--percy-text-primary)',
          'text-secondary': 'var(--percy-text-secondary)',
          'text-muted': 'var(--percy-text-muted)',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
} satisfies Config
```

## Implementation Order
1. Add Quicksand font import
2. Add CSS variables for both themes in `assets/css/themes.css`
3. Configure Tailwind with percy- color tokens
4. Implement theme store (Pinia, persisted)
5. Add theme selector in Settings page
6. Configure @nuxtjs/color-mode for dark mode
7. Apply tokens to all existing components (layout, sidebar, cards, buttons, inputs)
8. Generate illustrations via Sora (or placeholder colored backgrounds for v1)
9. Test all 4 combinations: Terracotta Light, Terracotta Dark, Saphir Light, Saphir Dark
