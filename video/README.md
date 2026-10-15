# DRS showcase video

A 66-second motion-graphics showcase of the Defects and Reviews System, made with [Remotion](https://www.remotion.dev). It mixes animated recreations (the DRS mark, the seven-system diagram, device and team scenes) with real captures of the app, which a virtual camera pans and zooms through.

1920x1080, 30 fps, H.264.

## Scenes

Times are when each scene's transition in starts. Scenes are cut on a 120 BPM grid: one beat is 15 frames and one 4/4 bar is 2 seconds, so every section change lands on a bar line.

| Start | Bar | Scene | What happens |
| --- | --- | --- | --- |
| 0:00 | 1 | Intro | The DRS mark's three sheets feed into place, then the title |
| 0:04 | 3 | Devices | Printer and copier models drift past, from desktop printers to A3 copiers |
| 0:08 | 5 | Seven systems | ClearQuest, ClearCase and Review Board feed DRS, which mirrors to Jira, Perforce, Helix Swarm and Confluence |
| 0:14 | 8 | 01 Insights | KPI ranges switch, severity targets, review turnaround chart |
| 0:22 | 12 | 02 Triage | J/K/X keyboard triage with bulk edit, then Ctrl+K search |
| 0:30 | 16 | 03 Report | Typing a new defect surfaces a likely duplicate |
| 0:36 | 19 | 04 Defects | Severity targets, records across systems, relationship map |
| 0:44 | 23 | 05 Code review | Turnaround, an inline line comment, the approval |
| 0:50 | 26 | 06 Email digests | The daily summary prints out of a printer |
| 0:54 | 28 | 07 People | The team photos, then the reporter, fixer and approver of D-17-0363 |
| 1:00 | 31 | Outro | Mark, title and a feature recap; ends at 1:06 (bar 34) |

## Make it

Requires Node.js 22 or later and pnpm.

```sh
# 1. Run the app (in the repository root)
pnpm install
pnpm dev

# 2. Capture it (in video/, in another terminal)
cd video
pnpm install
pnpm capture        # screenshots to public/captures, element positions to src/layout.json

# 3. Preview or render
pnpm studio         # opens Remotion Studio
pnpm render         # writes out/drs-showcase.mp4
```

`pnpm capture` drives the app with Playwright at 1600x900 and 2x scale. If Playwright has no browser yet, run `pnpm exec playwright install chromium` first. Set `DRS_URL` to capture a deployed copy instead of `http://localhost:5173`.

Remotion downloads Chrome Headless Shell on its first render. To use one that is already installed, set `REMOTION_BROWSER_EXECUTABLE` to its path.

The captures, fonts and the app's images (copied from `../public` by `pnpm assets`, which `studio` and `render` run first) are gitignored. `src/layout.json` is committed, since the scenes' zoom targets depend on it.

The render is a high-quality master (CRF 16, about 34 MB). For a smaller copy to put on a website, and a poster frame from the title card:

```sh
ffmpeg -i out/drs-showcase.mp4 -c:v libx264 -preset slow -crf 20 -movflags +faststart out/drs-showcase-web.mp4
node scripts/stills.mjs DrsShowcase:110 --scale=1   # out/stills/DrsShowcase-110.png
```

Each scene is also its own composition under **Scenes** in the Studio. To render stills for review:

```sh
node scripts/stills.mjs Scene-insights:60,120 DrsShowcase:900 --scale=1
```

## Music

The soundtrack, `public/music/drs-theme.mp3`, was made with the [ElevenLabs Music API](https://elevenlabs.io/docs/api-reference/music/compose) (`music_v2_5`). `music/compose.json` is the request: an instrumental composition plan at 120 BPM in F major, with one chunk per section of the video, so the music changes where the scenes do.

| Chunk | Time | Scenes |
| --- | --- | --- |
| Intro | 0:00 to 0:04 | Intro |
| Build | 0:04 to 0:14 | Devices, seven systems |
| Main groove | 0:14 to 0:30 | Insights, triage |
| Second groove | 0:30 to 0:50 | Report, defects, code review |
| Breakdown | 0:50 to 0:54 | Email digests |
| Lift | 0:54 to 1:00 | People |
| Outro | 1:00 to 1:06 | Outro |

To make a new take (this spends ElevenLabs credits, and each run sounds different):

```sh
ELEVENLABS_API_KEY=... pnpm music
```

Behind a proxy, add `NODE_USE_ENV_PROXY=1` so Node's `fetch` uses it.

The composition plays the track by default. `musicVolume` (default 0.8) sets the level, and `musicOffset` (default 1) skips that many frames at the start of the track so its beats land on the cuts; the current take's kicks come about one frame late without it. For a silent render, pass `--props='{"musicSrc":""}'`.

## Closing card

`credit` and `url` add a line to the closing card, for example `--props='{"credit":"Your Name","url":"example.com/drs"}'`. Both are empty by default.

## Layout

- `src/Showcase.tsx`: scene order, lengths in beats and transitions
- `src/scenes/`: one file per scene
- `src/components/camera.ts`: the virtual camera over captured pages (scroll, then zoom), and helpers that frame a page rect
- `src/components/Screen.tsx`: the browser window and captured screen; the sidebar stays fixed while the page scrolls
- `src/components/Overlays.tsx`: spotlights, keycaps, section labels and word-by-word text
- `src/components/Logo.tsx`: the animated DRS mark
- `scripts/capture.mjs`: the Playwright capture script
- `scripts/music.mjs` and `music/compose.json`: the ElevenLabs soundtrack request
