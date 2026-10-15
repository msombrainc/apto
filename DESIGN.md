# Apto AIMS — UX charter (apto#42)

**Status:** Frozen for implement (2026-10-15)  
**Source of truth:** [Interactive preview](https://apto-aims-preview.vercel.app) (Figma-aligned; preview wins over legacy STG shell)

## Product framing

AIMS is the operator console for ITAD: **Accounts** (customer SLAs), **Jobs & SLA** (live countdown), **Inventory** (asset audit trail). Visual language: confident industrial SaaS — dark default, optional light theme, orange accent, cream primary CTA on login.

## Themes

Apply `data-theme="dark"` | `data-theme="light"` on `<html>`. Persist choice in `localStorage` key `apto-aims-theme`.

| Token | Dark | Light |
|-------|------|-------|
| `--aims-bg` | `#10151c` | `#f4f6f9` |
| `--aims-surface` | `#161d27` | `#ffffff` |
| `--aims-surface-elevated` | `#1c2430` | `#ffffff` |
| `--aims-border` | `#29323f` | `#d8dee8` |
| `--aims-text` | `#f1efeb` | `#0f172a` |
| `--aims-text-muted` | `#94a3b8` | `#64748b` |
| `--aims-accent` | `#e85d2b` | `#e85d2b` |
| `--aims-cta-bg` | `#f1efeb` | `#0f172a` |
| `--aims-cta-text` | `#10151c` | `#f8fafc` |
| `--aims-sidebar-bg` | `#121820` | `#0f172a` |
| `--aims-sidebar-text` | `#e2e8f0` | `#f8fafc` |

SLA row semantics (unchanged): on-track green tint, at-risk amber, overdue red — tuned per theme in CSS.

## Login (unauthenticated)

Split viewport (~55% hero / ~45% form):

- **Hero:** grid texture, Apto Solutions mark, headline “Custom ITAD. Total coverage. Transparent results.”, supporting copy, three pillars (Accounts / Jobs / Inventory).
- **Panel:** “Sign in to AIMS”, username + password, cream/dark CTA “Sign in →”, footnote “Prototype · test data only”.
- Demo credentials remain `demo` / `demo` (factory STG); preview password is not wired in product.

Baseline: `docs/ux/screenshots/apto-42-login-{light,dark}.png`

## Authenticated shell

- **Sidebar** (`aria-label="Main menu"`): logo, “AIMS”, primary nav buttons (Accounts, Jobs & SLA, Inventory), theme toggle (Dark | Light), sign out.
- **Main:** page title, optional subtitle, cards for forms/tables; max-width ~1200px content column.
- **Accounts / Jobs / Inventory:** preserve existing data-test flows and API wiring; restyle only.

Baselines: `docs/ux/screenshots/apto-42-*-{light,dark}.png`

## Out of scope (this ticket)

Preview-only sections: “Future · AI”, preview state radiogroup, integrations nav, mock counts on nav badges.

## Implement checklist

- [ ] CSS variables + theme toggle
- [ ] Login split layout
- [ ] Sidebar + main layout for all three views
- [ ] Responsive: stack login on narrow viewports; collapsible sidebar optional (min-width 768px two-column)
