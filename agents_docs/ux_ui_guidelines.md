# UX/UI Guidelines — Design System & Interface Patterns

## Role Context
When Claude reads this file, it should think as a **Senior UX/UI Designer**.
Focus: consistency, usability, visual hierarchy, responsive design, component reuse.

## Design System Foundation

### Color Palette (Tailwind-based)
Use Tailwind's default palette with these semantic mappings:
- **Primary**: `blue-600` (actions, links, active states)
- **Success**: `green-600` (confirmations, completions)
- **Warning**: `amber-500` (alerts, attention)
- **Danger**: `red-600` (destructive actions, errors)
- **Neutral**: `slate-*` (text, borders, backgrounds)
  - Text primary: `slate-900`
  - Text secondary: `slate-600`
  - Borders: `slate-200`
  - Background: `slate-50` (page), `white` (cards)

### Typography
- Font: system font stack (Tailwind default: `font-sans`)
- Scale:
  - Page title: `text-2xl font-bold` (24px)
  - Section title: `text-lg font-semibold` (18px)
  - Body: `text-sm` (14px) — default for dense dashboard UIs
  - Caption: `text-xs text-slate-500` (12px)
- Line height: Tailwind defaults are fine (`leading-normal`)

### Spacing & Layout
- Grid unit: 4px (Tailwind's default spacing scale)
- Card padding: `p-4` (16px) on desktop, `p-3` (12px) on mobile
- Section gaps: `gap-4` or `gap-6`
- Dashboard grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`

### Elevation
- Cards: `shadow-sm border border-slate-200 rounded-lg`
- Modals: `shadow-xl`
- Dropdowns: `shadow-md`
- No heavy shadows. Keep it flat and clean.

## Component Library (shadcn-vue)

Use shadcn-vue for all standard UI primitives. Don't reinvent:
- `Button` — all clickable actions
- `Input`, `Textarea`, `Select` — form controls
- `Card`, `CardHeader`, `CardContent` — content containers
- `Dialog` — modals
- `DropdownMenu` — menus
- `Toast` — notifications
- `Badge` — status indicators
- `Skeleton` — loading states
- `Tooltip` — contextual help

### When to Build Custom
Only build custom components for:
- Skill-specific widgets (chart, calendar view, etc.)
- Dashboard summary cards (each skill has its own design)
- Layout components (sidebar, header — these are project-specific)

## Page Patterns

### Dashboard Page
```
[Header: app name + user menu]
[Grid of SkillCards]
```
- Each SkillCard shows: icon, name, 1-2 line summary of current state, click to navigate
- Cards are interactive (hover: slight elevation increase)
- Empty state: show a "Get started" message with suggested skills

### Skill Page
```
[Breadcrumb: Dashboard > Skill Name]
[Skill header: icon + title + optional actions]
[Skill content area]
```
- Consistent header pattern across all skills
- Content area is skill-specific
- Always provide a way back to dashboard (breadcrumb + sidebar)

### Auth Pages
```
[Centered card on neutral background]
[Logo]
[Form]
[Link to register/login]
```
- Minimal, clean, no distractions

## Interactive Patterns

### Loading States
- Page load: use `<NuxtLoadingIndicator>` (top progress bar)
- Component load: use shadcn `Skeleton` components
- Button actions: show spinner inside button, disable during action
- NEVER show a blank page. Always show skeleton or progress.

### Empty States
- Every list/grid must handle the empty case.
- Show: icon + message + primary action button.
- Example: "No todos yet. Create your first one."

### Error States
- Inline errors near the relevant element (form validation).
- Toast for transient errors (network failures, server errors).
- Full-page error only for 404 / catastrophic failures.

### Confirmations
- Destructive actions (delete) always require a confirmation dialog.
- Non-destructive actions can use optimistic UI (update immediately, rollback on error).

## Responsive Breakpoints
Follow Tailwind defaults:
- `sm`: 640px (small tablets)
- `md`: 768px (tablets)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)

### Mobile Adaptations
- Sidebar → hamburger menu (overlay)
- Grid columns: 1 on mobile, 2 on tablet, 3 on desktop
- Touch targets: minimum 44x44px for all interactive elements
- No hover-only interactions (hover enhances but doesn't gate access)

## Accessibility
- Focus rings on all interactive elements (Tailwind `focus-visible:ring-2`)
- Skip navigation link (hidden, visible on focus)
- Color contrast: WCAG AA minimum (4.5:1 for text)
- Form errors announced to screen readers (aria-live)
- shadcn-vue handles most ARIA patterns — don't override unless necessary

## Animation
- Keep it subtle and functional.
- Page transitions: `opacity` fade (150ms).
- Sidebar open/close: `transform translateX` (200ms).
- Card hover: `shadow` transition (150ms).
- No decorative animations. Every animation must serve a UX purpose.
