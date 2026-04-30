## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: none

---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**macrobator** — a SvelteKit 5 web application.

## Commands

```bash
npm run dev          # start dev server (http://localhost:5173)
npm run build        # production build
npm run preview      # preview production build
npm run check        # svelte-check type checking
npm run lint         # lint
npm run format       # format with prettier
npm test             # run tests (vitest)
npm run test -- -t "test name"   # run a single test by name
```

## Architecture

SvelteKit 5 uses the **runes** reactivity model — prefer `$state`, `$derived`, `$effect`, and `$props` over the legacy `writable`/`readable` store APIs.

### Key conventions

- **Routing**: file-based under `src/routes/`. Each route folder can have `+page.svelte`, `+page.ts` (load), `+layout.svelte`, `+layout.ts`, `+server.ts` (API endpoints).
- **Load functions**: use `+page.ts` for universal loads (runs on server + client), `+page.server.ts` for server-only loads (DB, secrets). Return data is typed via `PageData` / `LayoutData`.
- **Form actions**: defined in `+page.server.ts` as `actions` export; use `enhance` for progressive enhancement.
- **Shared code**: `src/lib/` (imported as `$lib`). Server-only utilities go in `src/lib/server/` — SvelteKit will error if these are imported client-side.
- **Static assets**: `static/`.

### SvelteKit 5 runes

```svelte
<script lang="ts">
  let count = $state(0);
  let doubled = $derived(count * 2);
  let { prop } = $props();
  $effect(() => { /* runs reactively */ });
</script>
```

Avoid `export let` for props and `$:` reactive declarations — those are Svelte 4 patterns.
