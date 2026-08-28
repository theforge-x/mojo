# Mojo Design System

A design system built from the 22 CSS custom properties in the brief — nothing renamed,
nothing added to the palette. Light and dark both resolve from the same variable names,
so components never need theme-specific branches.

## What's here

| File | What it is |
|---|---|
| `mojo-design-system.html` | Interactive, open-anywhere style guide. Toggle light/dark in the header; click any color card to copy its variable name. |
| `globals.css` | The token file, completed and ready to drop into `app/globals.css`. Includes the `@theme inline` mapping and a `next/font` snippet for `--font-manrope` / `--font-dm-sans` / `--font-dm-mono`. |
| `lib/utils.ts` | `cn()` — the `clsx` + `tailwind-merge` helper every component below imports. |
| `components/ui/button.tsx` | 7 variants (primary, secondary, tertiary, outline, ghost, destructive, link) × 4 sizes. |
| `components/ui/badge.tsx` | 6 variants, mono type. |
| `components/ui/card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`. |
| `components/ui/input.tsx` | Text input with `input`/`ring` focus states. |
| `components/ui/alert.tsx` | `info` / `warning` / `danger`, mapped to existing tokens — no new colors introduced. |

Components assume shadcn/ui-style conventions (`class-variance-authority`, `@radix-ui/react-slot`,
`clsx`, `tailwind-merge`, path alias `@/*`) since the token structure — `card-foreground`,
`popover`, `color-mix`-based `muted-foreground`, split `radius-lg/md/sm` — is that system's shape.
Install what you don't have:

```
pnpm add class-variance-authority clsx tailwind-merge @radix-ui/react-slot
```

## How the roles break down

**Brand** — `primary` (mint, `#00ebc7`) carries the one action you want taken. `secondary`
(coral, `#ff5470`) and `tertiary` (yellow, `#fde24f`) sit at equal visual weight for
alternate actions or highlights — reach for whichever reads right against its neighbors,
not a fixed hierarchy between the two.

**Surfaces** — `background` is the page canvas; `card` and `popover` are one step up and,
notably, *identical* in light mode (`#f2f4f6` / `#fffffe`) but diverge in dark mode
(`card` sits on the navy scale, `popover` stays closer to the surface) — dark mode leans
on layering to keep depth legible where light mode uses only contrast.

**Feedback** — `destructive` reuses `secondary`'s coral rather than introducing a fourth
brand color. That's a deliberate constraint: it means an error state and a "high-energy"
UI moment share the same visual register, so keep destructive actions rare enough that
users don't start reading coral as ambient decoration.

## Accessibility notes

Contrast ratios (WCAG 2.1, sRGB) for the pairs that ship together:

- `primary` / `primary-foreground` — **10.4:1** (AAA)
- `tertiary` / `tertiary-foreground` — **12.2:1** (AAA)
- `background` / `foreground` — **13.9:1** (AAA)
- `secondary` / `secondary-foreground` (and `destructive`, same hex) — **~3.1:1**. This
  clears AA for large or bold text (≥18.66px, or ≥14px bold) and for non-text UI
  components (3:1 per SC 1.4.11), but falls under the 4.5:1 needed for small body
  copy. In practice: fine for button labels and badges, not for a coral paragraph
  on white. The `warning` alert in the showcase flags this same finding live.

`--ring` matches `--primary` in both themes, so focus states stay visible against every
surface token — verify that holds if you introduce a background outside this set.

## Extending it

Spacing and shadow scales weren't part of the brief, so none are baked into the components
above — `p-5`, `gap-3`, etc. are used directly. If the product needs a formal spacing
scale, define it the same way these were: one base unit, calculated steps, named for what
they mean (`space-xs` / `space-sm` …) rather than raw pixel values, so the system stays
editable from a single number the way `--radius` already is.
