# Defects and Reviews System (DRS)

A demo of the defect and code review tracker at Samsung Electronics' printing division in 2016-2017.

Defects, reviews, people, email addresses and engineering specs are mock data. Model numbers are made up ("PS-" ids that are not real products), product photos are generated stand-ins, and Samsung and its product line names appear only for context. This demo is not affiliated with or endorsed by Samsung Electronics.

## What's in it

| Page | Route |
| --- | --- |
| Insights: turnaround against targets, defect flow, review outcomes, team load, migration progress | `/` |
| Defects: list with scopes, filters, sorting, bulk edits, all kept in the URL; detail with a status workflow, activity, changelists, related records and a relationship graph | `/defects`, `/defects/[id]` |
| Code reviews: list, detail with side-by-side or unified diffs, line comments, reviewer decisions, withdraw and resubmit | `/reviews`, `/reviews/[id]` |
| Report a defect / request a review (with duplicate detection) | `/defects/new`, `/reviews/new` |
| Daily and weekly summary emails, with an archive back to January 2016 | `/digests` |
| Teams and profiles | `/teams`, `/teams/[id]` |
| Notifications, settings, about | `/notifications`, `/settings`, `/about` |

Keyboard shortcuts: <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>K</kbd> search, <kbd>/</kbd> filter, <kbd>N</kbd> new, <kbd>J</kbd>/<kbd>K</kbd> move, <kbd>Enter</kbd> open, <kbd>X</kbd> select, <kbd>?</kbd> settings.

Switch users in Settings to see each role's permissions: Code Review Team members can assign reviewers and approve changes.

## Stack

- [Vite](https://vite.dev) and React 19, as a single-page app with [React Router](https://reactrouter.com)
- [Base UI](https://base-ui.com) components, styled with Tailwind CSS v4
- [Lucide](https://lucide.dev) icons
- [React Flow](https://reactflow.dev) for the migration and relationship diagrams
- Cloudflare Workers static assets, through the Cloudflare Vite plugin and Wrangler, plus a small Worker for the video

## Mock data

`lib/seed/` generates the data in the browser from a fixed seed, so every visitor starts from the same history: about 800 defects and 630 code reviews from January 2016 to September 2017, across 44 printer and copier models, 34 people in 8 teams and 3 migration waves. Activity follows working days and Korean public holidays, ramps up as teams adopt the tool, and tracks each model's launch window. The showcase records in `lib/seed/handwritten.ts` are written by hand.

The generator keeps the history consistent, and `pnpm test` checks it:

- Each defect template lists the capabilities it needs (copy, scan, fax, color, A3, hard disk and so on, from `lib/seed/fixes.ts`), and defects are only filed on models that have them, including the other models they affect. The capabilities come from the same rules as the spec table on each defect page (`capsOf` in `lib/products.ts`).
- Each template has its own fix, so a bug-fix review's title, diff and test name match its defect.
- A defect is resolved only after its fix review is approved, and stays in progress while the fix is in review. Every resolved defect has a resolution; fixed ones show a review or a `p4 fix` changelist.
- The adjustments use fixed values instead of the random stream, so record ids stay the same when templates change.

Everything renders in the browser. Your edits are saved to `localStorage` on top of the generated data; Settings → Reset demo data discards them. Bump `SEED_VERSION` in `lib/seed/generate.ts` when the generator changes, so saved edits from an older seed are dropped.

The demo clock starts at 15 September 2017, 18:00 (`TNOW` in `lib/dates.ts`), whatever the visitor's time of day, and runs with the visit, so every visitor sees the same durations and new activity always sorts after the history.

## Development

Requires Node.js 22 or later and pnpm.

```sh
pnpm install
pnpm dev          # http://localhost:5173, with the /stream Worker in the Workers runtime
pnpm typecheck
pnpm test         # invariants over the generated data and the Insights numbers
```

## Build and deploy

```sh
pnpm build        # outputs dist/client (the app) and dist/samsung_drs_demo (the Worker)
pnpm preview      # serves the production build locally in the Workers runtime
pnpm run deploy   # builds and deploys to Cloudflare Workers
```

`pnpm run deploy` needs a Cloudflare login (`pnpm wrangler login`) or `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the environment. The Worker name is set in `wrangler.jsonc`.

To deploy from Git with Workers Builds instead, connect the repository in the Cloudflare dashboard and use `pnpm build` as the build command and `npx wrangler deploy` as the deploy command. The build writes `.wrangler/deploy/config.json`, which points Wrangler at the generated `dist/samsung_drs_demo/wrangler.json`.

The app is static files: `app/main.tsx` is the entry, `app/routes.tsx` lists the pages, and `index.html` holds the page head. `wrangler.jsonc` serves `index.html` for any URL that is not a file (`not_found_handling: "single-page-application"`), so a link straight to `/defects/D-17-0348` works and the router draws the page. Only `/stream/*` (see below) runs the Worker in `worker/index.ts`, through `run_worker_first`. Keep that rule to those paths: a catch-all rule also makes the dev server send Vite's own modules to the Worker and `pnpm dev` serves 404s.

Link previews use `public/og-image.png` (a 1200x630 screenshot of Insights) and the absolute image URLs in the Open Graph and Twitter tags in `index.html`; update them if the demo moves to another domain. Every page shares these tags. Each page sets its own tab title once the app loads.

## Showcase video

`video/` is a [Remotion](https://www.remotion.dev) project that captures the running app and renders a 66-second showcase video. See [video/README.md](video/README.md).

The About page plays a copy of it from `public/video`, encoded to stay under the 25 MiB limit for a single Workers static asset. `public/_headers` lets browsers and Cloudflare cache those files for a year, so a new render gets a new version in its file name.

Workers static assets answer a Range request with the whole file, and a browser can only seek a video with partial (206) responses. So the page plays it from `/stream/<file>` instead: `worker/index.ts` sends `/stream/*` to `worker/stream.ts`, which reads `public/video/<file>` from the assets binding and sends the bytes asked for. The binding gives no file sizes, so `vite.config.ts` records them at build time (`virtual:video-sizes`).

## Generated images

The product shots in `public/products` and the staff portraits in `public/photos` are generated stand-ins, made with OpenAI's GPT Image 2.5 (`gpt-image-2.5-flare`) at `quality: "low"` on a transparent background and saved as small transparent WebP files sized for the thumbnails they fill. They stay as they are and do not need regenerating.

Any new or replacement image is generated with GPT Image 2.6 (`gpt-image-2.6-flare`, or `gpt-image-2.6-sunburst`, the same release at the same price) at `quality: "low"` with `background: "transparent"`, and saved the same way. Three things to know about 2.6:

- OpenAI's Batch API does not accept either 2.6 model (it answers `model_not_found`), so send each request synchronously.
- At `low` it is 664 image output tokens at 1536x1024 or 1024x1536 and 824 at 1024x1024, about $0.02-0.025 an image at $30 per 1M (2.5 used 158 and 196).
- A subject comes back at alpha 254, not 255, so count 250 and above as opaque when checking a cut-out.

## Credits

Product logos in `public/logos` belong to their owners and are used only to label the systems DRS synced with. The Perforce mark is from [Simple Icons](https://simpleicons.org). Fonts: [Pretendard](https://github.com/orioncactus/pretendard) and [JetBrains Mono](https://www.jetbrains.com/lp/mono/). The sales region map in device details is built from [Natural Earth](https://www.naturalearthdata.com) 1:110m countries (public domain) by `scripts/region-map.mjs`, which writes `lib/region-map.ts`.
