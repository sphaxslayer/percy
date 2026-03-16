# Product Specification — Percy Personal Assistant

## Role Context
When Claude reads this file, it should think as a **Product Manager**.
Focus: user value, feature prioritization, scope control, UX decisions.

## Product Vision
Percy is a personal assistant that aggregates useful "Skills" in a unified dashboard.
Each skill automates or simplifies a recurring task in daily life.
The goal: open Percy once → see everything that matters → act quickly → close.

## Target User
- Primary: the project owner (power user, developer, wants automation)
- Secondary: potential sharing with close collaborators (multi-user ready)

## Core UX Principles
1. **Dashboard-first**: The main view is a dashboard showing skill summaries at a glance.
2. **One skill = one page**: Clicking a skill card opens its dedicated page.
3. **Minimal clicks**: Common actions should require ≤2 clicks from the dashboard.
4. **Mobile-ready**: Every screen must work on phone (375px+). Not mobile-first design, but responsive.
5. **No bloat**: If a feature doesn't save time, it doesn't belong.

## Dashboard Layout
```
┌─────────────────────────────────────────────┐
│  🏠 Percy          [🔔] [👤 User Menu]     │
├─────────┬───────────────────────────────────┤
│         │                                   │
│ Skills  │  Dashboard Grid                   │
│ nav     │  ┌─────────┐  ┌─────────┐        │
│         │  │ Skill 1  │  │ Skill 2  │       │
│ • Skill1│  │ summary  │  │ summary  │       │
│ • Skill2│  └─────────┘  └─────────┘        │
│ • Skill3│  ┌─────────┐  ┌─────────┐        │
│ • ...   │  │ Skill 3  │  │ Skill 4  │       │
│         │  │ summary  │  │ summary  │       │
│         │  └─────────┘  └─────────┘        │
│         │                                   │
│ [+ Add] │                                   │
└─────────┴───────────────────────────────────┘
```

On mobile, the sidebar collapses into a hamburger menu. The grid becomes a single column.

## Skill Registry
Each skill declares metadata:
```typescript
// app/config/skills.ts
export interface SkillDefinition {
  id: string           // kebab-case unique ID
  name: string         // Display name
  description: string  // One-line description
  icon: string         // Lucide icon name
  route: string        // Route path
  dashboardComponent?: string  // Optional: summary widget for dashboard
  enabled: boolean     // User can toggle skills on/off
}
```

This registry drives the sidebar navigation, dashboard grid, and skill routing.

## Feature Backlog (Prioritized)
Skills are added incrementally. Here is the planned order:

### P0 — Foundation (MVP)
- [ ] Auth: registration, login, session management
- [ ] Dashboard: shell layout, sidebar, skill grid
- [ ] Skill registry: dynamic skill loading from config
- [ ] First skill: **TBD — user to define**

### P1 — Essential Skills
- [ ] Notes / quick capture
- [ ] Bookmarks / link manager
- [ ] Reminders / simple scheduling
- [ ] Weather widget

### P2 — Power Skills
- [ ] Expense tracker
- [ ] Habit tracker
- [ ] RSS / news aggregator
- [ ] AI chat integration (Claude API)

### P3 — Advanced
- [ ] Calendar integration (Google Calendar via MCP or API)
- [ ] Email digest (Gmail summary)
- [ ] Automation rules (IFTTT-like: if X then Y)
- [ ] Mobile PWA with push notifications

## Scope Control Rules
- Each new skill is a separate PR.
- A skill is "done" when: it has a page, API, tests, and a dashboard summary card.
- Don't gold-plate v1 of a skill. Ship the core value, iterate later.
- If a feature takes >2 days to implement, it's probably too big. Split it.
