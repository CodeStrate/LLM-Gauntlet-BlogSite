# LLM Gauntlet

> Local LLM coding benchmark — open-source models, real backend tasks, executed on a 24GB MacBook with no cloud cheats.
> Live: **[llmarena-ten.vercel.app](https://llmarena-ten.vercel.app/)**

The site is the front-end for an evaluation harness that runs open-source coding models against seven backend engineering tasks (T1–T7): a YAML parser FIM, an async refactor, a concurrent-cache race condition, a distributed Redis job scheduler, a retry decorator, a memoize decorator, and an observable typed state machine. Models are scored execution-first — if it doesn't compile and meet the architectural constraints, it doesn't score.

This repository ships the React/Vite UI, the scoring components, the leaderboard, and the rendering layer for the long-form write-ups (episodes, deliberations, methodology). The benchmark content itself (markdown, chat dumps, score data) lives outside this repository for now.

## Stack

- **React 19** + **TypeScript** with **Vite 8** (Rolldown bundler)
- **Tailwind CSS v4** (`@theme` design tokens, `data-theme="dark"` overrides)
- **react-router-dom 7** for SPA routing
- **react-markdown** + `remark-gfm` + `remark-breaks` + `remark-wiki-link` for the article reader
- **framer-motion** for the homepage carousel and list animations
- **@iconify/react** for vendor brand marks
- **bun** as the package manager and dev runner

## Getting started

```bash
bun install
bun run dev              # Vite dev server on :5173
bun run build            # Production build (tsc -b && vite build)
bun run preview          # Serve dist/ locally
bun run lint             # ESLint
```

The `bun run content` script regenerates `src/content/manifest.json` from the upstream Obsidian vault. It's intentionally local-only — see "Content layer" below.

## Project layout

```
.
├── index.html                 # Root HTML, font preconnects, no-flash theme script
├── public/                    # Static assets (favicon, brand marks, hero SVGs)
├── scripts/
│   └── build-content.ts       # Vault → src/content/manifest.json (run locally)
├── src/
│   ├── App.tsx                # Routes: /, /models, /models/:slug, /blog,
│   │                          # /blog/:slug, /docs/:slug, /deliberations/:slug,
│   │                          # /agentic, /rubrics, /leaderboard
│   ├── main.tsx
│   ├── index.css              # Tailwind v4 @theme tokens + dark overrides
│   ├── components/
│   │   ├── Layout.tsx         # Nav + main + footer + global Cmd-K search
│   │   ├── Nav.tsx            # Sticky header with contextual dropdowns
│   │   ├── HeroCarousel.tsx   # Homepage gradient carousel
│   │   ├── ModelCard.tsx      # 2-up grid card with hover wipe
│   │   ├── BrandIcon.tsx      # Iconify-driven vendor marks
│   │   ├── Prose.tsx          # Markdown renderer with wikilink resolution
│   │   ├── SearchPalette.tsx  # Cmd-K command palette
│   │   ├── ThemeToggle.tsx    # Sun/moon toggle, system-aware
│   │   └── …
│   ├── pages/
│   │   ├── Home.tsx           # Hero + leaderboard preview + recent posts
│   │   ├── Models.tsx         # Filterable grid (Track A/B/Benched + Small)
│   │   ├── ModelDetail.tsx    # Per-model breakdown
│   │   ├── Blog.tsx           # Sidebar nav + Medium-style article list
│   │   ├── DocReader.tsx      # Long-form article view with scroll-spy TOC
│   │   ├── Agentic.tsx        # Agentic V2 — state coordinator (see below)
│   │   ├── Rubrics.tsx        # Per-task scoring criteria
│   │   └── Leaderboard.tsx    # Score table by track
│   ├── components/agentic/    # Agentic V2 sub-components (see below)
│   │   ├── types.ts           # Command, HistoryEntry shared types
│   │   ├── renderers.tsx      # ContentRenderer, ToolOutputViewer, EditDiffViewer
│   │   ├── CommandPalette.tsx # Ctrl+P overlay
│   │   ├── ThemePicker.tsx    # Searchable theme switcher modal
│   │   ├── ModelPicker.tsx    # Session/agent switcher modal
│   │   ├── SessionHistoryModal.tsx  # Last-50 viewed sessions
│   │   └── SessionView.tsx    # Full-screen chat log viewer (chat + sidebar)
│   ├── lib/
│   │   ├── content.ts         # Manifest + raw markdown access
│   │   ├── models.ts          # Models data layer
│   │   ├── search.ts          # Search index for the palette
│   │   ├── theme.ts           # Theme hook (light/dark/system)
│   │   ├── agenticChats.ts    # Chat log parser + AGENTIC_MODELS registry
│   │   └── agenticThemes.ts   # AgenticTheme type + AGENTIC_THEMES map
│   └── content/               # Local-only — see "Content layer"
└── vercel.json                # SPA rewrite rule for direct route hits
```

## Content layer

The site reads vault markdown at build time via Vite's `import.meta.glob('?raw')` and renders it through `react-markdown`. The raw markdown lives in `src/content/vault/` and the index lives at `src/content/manifest.json`.

This `content/` directory is **not tracked in this public repository** — see `.gitignore`. The benchmark write-ups, deliberation logs, and chat dumps stay local while the site code is open-source. Anyone forking this repo will need to provide their own `src/content/manifest.json` (matching the `Doc` shape in [`src/lib/content.ts`](src/lib/content.ts)) and their own markdown under `src/content/vault/` to render anything.

## Theming

Light mode is the default. Dark mode is wired through CSS custom-property overrides on `[data-theme="dark"]` in `src/index.css`. The theme hook in [`src/lib/theme.ts`](src/lib/theme.ts) supports three states (`light` / `dark` / `system`); the toggle in the nav flips between explicit light and dark, and the no-flash inline script in `index.html` resolves the persisted choice before React mounts so there's no FOUC on dark.

## Search

`/` or `Cmd/Ctrl+K` opens a docs-style command palette (`src/components/SearchPalette.tsx`). The index is built statically from the manifest plus the model registry — see `src/lib/search.ts`. Hits are grouped by category (Episode / Deliberation / Methodology / Model / Page), arrow-key navigable, with a soft-fill active row and an Enter pill.

## Agentic V2 (WIP)

`/agentic` is a terminal-style UI for browsing recorded LangChain RAG benchmark sessions. It's being built toward a live chat interface once a lightweight SLM is deployed on the site.

**Current state:** read-only session viewer. Users can browse each model's recorded agentic run — thinking, tool calls, written files, and a metadata sidebar showing token usage, MCP tools, and file change stats.

**Planned:** the fake pulsing input at the bottom of each session becomes a real prompt box. The SLM responds in context, letting visitors ask follow-up questions about the benchmark results.

### Using the Agentic page

The text input at the top is **not a free-text chat box** — that's the planned SLM interface, not yet wired up. What does work:

**Slash commands** — type `/` in the input to autocomplete:

| Command | What it does |
|---|---|
| `/sessions` or `/agents` | Open the model/session picker |
| `/themes` | Open the theme switcher |
| `/variants` | Cycle to the next registered model |
| `/models` | Navigate to the Models page |
| `/leaderboard` | Navigate to the Leaderboard |
| `/blog` | Navigate to the Blog |
| `/rubrics` | Navigate to the Rubrics page |
| `/home` | Navigate to the homepage |

**Keyboard shortcuts** (work anywhere on the page):

| Shortcut | What it does |
|---|---|
| `Ctrl+P` | Open command palette |
| `Ctrl+X T` | Switch theme |
| `Ctrl+X M` | Switch model |
| `Ctrl+X R` | Open the current model's long-form report |
| `Ctrl+X B` | Open the agentic leaderboard |
| `Tab` | Cycle to next model (when suggestion list is open) |
| `Esc` | Close any open modal or return from session view |

**Session viewer** — click "● Session View" at the bottom of the main view to open the full-screen chat log for the currently selected model. Inside the session viewer:
- Scroll the left panel to read through the model's agentic run (thinking → tool calls → final response)
- Right sidebar shows context tokens, MCP status, modified files, and session stats
- `Ctrl+P` opens the command palette inside the session viewer too
- `← Return` button (or `Esc`) exits back to the main terminal view

### Architecture

`Agentic.tsx` is a thin state coordinator. It owns all modal/keyboard state and delegates rendering to focused components:

| Component | Responsibility |
|---|---|
| `SessionView` | Full-screen two-panel chat log viewer |
| `CommandPalette` | Ctrl+P overlay; driven by parent keyboard handler |
| `ThemePicker` | Searchable theme switcher |
| `ModelPicker` | Agent/session switcher |
| `SessionHistoryModal` | Last 50 viewed sessions (localStorage) |
| `renderers.tsx` | `ContentRenderer`, `ToolOutputViewer`, `EditDiffViewer` |

### Adding a theme

Open `src/lib/agenticThemes.ts` and add a new key to `AGENTIC_THEMES` with all 10 `--a-*` CSS variable values. The picker, localStorage persistence, and `AgenticThemeKey` type all update automatically — no other changes needed.

### Chat log format

Sessions are stored as `.md` files in `src/content/agentic/`. `agenticChats.ts` parses them at build time via Vite `?raw` imports. The format uses `## User` / `## Assistant (Model · Xs)` headings, `_Thinking:_` blocks, and `**Tool:** / **Input:** / **Output:**` fences. See any existing file in that directory for reference.

## Routing notes for Vercel

The site is a pure-client SPA. `vercel.json` ships a single rewrite rule (`/(.*) → /index.html`) so direct hits on routes like `/blog/episode-1-...` or `/models/<slug>` get served by the React app instead of 404'ing. `.vercelignore` keeps the upload tarball lean by excluding scoring scripts, local benchmark data, and Windows NTFS metadata streams.

## Credits

Site design + implementation: **CodeStrate**. Content collaborators: **Claude 4.6** (judging) and **Gemini 3.1 Pro** (verification). Iconify brand marks via `simple-icons`. Type stack: **Lato** (sans), **JetBrains Mono** (mono), **League Gothic** (display).

## License

Code: MIT. Benchmark content (when published): CC BY-SA 4.0.
