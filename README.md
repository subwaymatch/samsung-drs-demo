# Defects and Reviews System (DRS)

A recreation of the defect and code review tracker I built at Samsung Electronics' printing division in 2016–2017. Firmware, QA and code review teams in Suwon and Bangalore used it to track defects and code reviews for printer and copier firmware, measure them against severity targets, and keep records linked while moving from IBM Rational ClearQuest and Review Board to Perforce, Helix Swarm, Jira and Confluence.

Models, defects, reviews, people and other product details are mock data.

## What's in it

| Page | Route |
| --- | --- |
| Insights: turnaround against targets, defect flow, review outcomes, team load, migration progress | `/` |
| Defects: list with scopes, filters, sorting, bulk edits; detail with activity, changelists, related records and a relationship graph | `/defects`, `/defects/[id]` |
| Code reviews: list, detail with side-by-side or unified diffs, line comments, reviewer decisions, withdraw and resubmit | `/reviews`, `/reviews/[id]` |
| Report a defect / request a review (with duplicate detection) | `/defects/new`, `/reviews/new` |
| Daily and weekly summary emails, with an archive back to January 2016 | `/digests` |
| Teams and profiles | `/teams`, `/teams/[id]` |
| Notifications, settings, about | `/notifications`, `/settings`, `/about` |

Keyboard shortcuts: <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>K</kbd> search, <kbd>/</kbd> filter, <kbd>N</kbd> new, <kbd>J</kbd>/<kbd>K</kbd> move, <kbd>Enter</kbd> open, <kbd>X</kbd> select, <kbd>?</kbd> settings.

Switch users in Settings to see each role's permissions: Code Review Team members can assign reviewers and approve changes.

## Stack

- [Vinext](https://github.com/cloudflare/vinext): the Next.js App Router API on Vite, with React 19
- [Base UI](https://base-ui.com) components, styled with Tailwind CSS v4
- [Lucide](https://lucide.dev) icons
- [React Flow](https://reactflow.dev) for the migration and relationship diagrams
- Cloudflare Workers, through the Cloudflare Vite plugin and Wrangler

## Mock data

`lib/seed/` generates the data in the browser from a fixed seed, so every visitor starts from the same history: about 800 defects and 630 code reviews from January 2016 to September 2017, across 44 printer and copier models, 34 people in 8 teams and 3 migration waves. Activity follows working days and Korean public holidays, ramps up as teams adopt the tool, and tracks each model's launch window. The showcase records in `lib/seed/handwritten.ts` are written by hand.

The server renders only the page shell. Your edits are saved to `localStorage` on top of the generated data; Settings → Reset demo data discards them. Bump `SEED_VERSION` in `lib/seed/generate.ts` when the generator changes, so saved edits from an older seed are dropped.

The app's "today" is fixed at 15 September 2017 (`lib/dates.ts`).

## Development

Requires Node.js 22 or later and pnpm.

```sh
pnpm install
pnpm dev          # http://localhost:5173, running in the Workers runtime
pnpm typecheck
```

## Build and deploy

```sh
pnpm build        # outputs dist/client (static assets) and dist/server (Worker)
pnpm start        # serves the production build locally with Wrangler
pnpm run deploy   # builds and deploys to Cloudflare Workers
```

`pnpm run deploy` needs a Cloudflare login (`pnpm wrangler login`) or `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the environment. The Worker name is set in `wrangler.jsonc`.

To deploy from Git with Workers Builds instead, connect the repository in the Cloudflare dashboard and use `pnpm build` as the build command and `npx wrangler deploy` as the deploy command. The build writes `.wrangler/deploy/config.json`, which points Wrangler at the generated `dist/server/wrangler.json`.

`wrangler.jsonc` has no `run_worker_first` rule. With one, the dev server also routes Vite's own modules to the Worker and `pnpm dev` serves 404s.

## Credits

Product logos in `public/logos` belong to their owners and are used only to label the systems DRS synced with. The Perforce mark is from [Simple Icons](https://simpleicons.org). Fonts: [Pretendard](https://github.com/orioncactus/pretendard) and [JetBrains Mono](https://www.jetbrains.com/lp/mono/).
