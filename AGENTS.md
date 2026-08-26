# AGENTS.md

Guide for agents working on dawidolko.pl. Add a section per area as conventions
emerge — do not pad sections with content that is not established yet.

## What this project is

A hand-built static multi-page website — semantic HTML, modular SASS and vanilla
JavaScript bundled with webpack. There is no framework and no runtime
dependency; pages are authored directly and styles compile to a single
stylesheet.

Read [README.md](README.md) first — it documents the architecture and the
commands used day to day.

## Language

**UI copy and code comments are English.** Labels, buttons, validation messages,
page titles, empty states and error text are all English. User-supplied data is
rendered exactly as entered and never normalised.

## Comments

Comments explain **why**, not what. The code already says what it does.

- Use multi-line block comments for anything that needs explaining; avoid
  trailing one-line comments tacked onto the end of a statement.
- A comment that restates the code is deleted rather than reworded.
- Document the constraint, the trade-off or the failure mode that made the code
  look the way it does — that is the part a reader cannot recover from the code.

## Accessibility

Non-negotiable, and cheap if you keep to the existing components:

- Never remove the global `:focus-visible` outline.
- Decorative icons are `aria-hidden="true"`; a meaningful icon gets a
  visually-hidden text equivalent.
- One `<h1>` per page and no skipped heading levels.
- Every page has `<header>`, `<nav>`, `<main id="main-content">` and `<footer>`,
  with a skip link as the first focusable element.
- Every form control has an associated label; errors use `role="alert"`.
- Honour `prefers-reduced-motion`.

## Styles

SASS partials live in `src/sass/` and compile to `src/css/main.css`.

**The compiled CSS has been hand-edited since the last SASS build**, so running
`npm run build:css` today would overwrite rules that only exist in the compiled
file — including the accessibility block. Reconcile the two before recompiling;
do not run the build blind.

## Before finishing

- [ ] `npm run build` succeeds.
- [ ] Every page keeps its landmarks, single `<h1>` and skip link.
- [ ] Canonical URL, meta description and Open Graph tags are present and page-specific.
- [ ] No secrets committed.
- [ ] Copy is English.
