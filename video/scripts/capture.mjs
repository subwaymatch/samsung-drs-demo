// Captures the footage for the showcase video from a running copy of the app.
//
//   pnpm dev                     (in the repository root)
//   pnpm --dir video capture     (in another terminal)
//
// Pass section names to re-capture only those pages and keep the rest, for
// example `pnpm capture defect review` after changing the detail pages.
//
// Screenshots are taken at 1600x900 CSS pixels and 2x device scale, so the video
// can zoom in to 2x without blurring. Element positions (CSS pixels, page
// coordinates) go to src/layout.json for the zoom and callout targets.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const BASE = process.env.DRS_URL || 'http://localhost:5173';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'captures');
const LAYOUT = join(ROOT, 'src', 'layout.json');
const VW = 1600;
const VH = 900;

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
// The demo clock starts at Sep 15, 2017 18:00 and runs with the visit. Freeze the
// browser clock so durations such as "Overdue by 2.5 days" stay the same while
// a capture runs.
await ctx.clock.setFixedTime(new Date('2026-01-01T09:00:00'));
const page = await ctx.newPage();
const only = process.argv.slice(2);
// A partial capture updates its own entries and keeps everything else.
const layout = only.length && existsSync(LAYOUT) ? JSON.parse(readFileSync(LAYOUT, 'utf8')) : { viewport: { w: VW, h: VH } };

const settle = async (ms = 600) => {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(ms);
};
const go = async path => {
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.mouse.move(VW - 2, VH - 2);
  await settle(1400);
};
const shot = async (name, opts = {}) => {
  await page.screenshot({ path: join(OUT, name + '.png'), ...opts });
  console.log('captured', name);
};

/** Page rect of the deepest element whose text is exactly `text`, optionally widened to `closest(sel)`. */
const rect = (text, sel, nth = 0) =>
  page.evaluate(
    ([text, sel, nth]) => {
      const hits = [...document.querySelectorAll('body *')].filter(
        e => e.textContent.trim() === text && ![...e.children].some(c => c.textContent.trim() === text)
      );
      let el = hits[nth];
      if (!el) throw new Error('Not found: ' + text);
      if (sel) el = el.closest(sel);
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) };
    },
    [text, sel || null, nth]
  );

/** Page rect of the smallest element containing both texts. */
const span = (a, b) =>
  page.evaluate(
    ([a, b]) => {
      const leaf = t =>
        [...document.querySelectorAll('body *')].find(
          e => e.textContent.trim() === t && ![...e.children].some(c => c.textContent.trim() === t)
        );
      const ea = leaf(a), eb = leaf(b);
      if (!ea || !eb) throw new Error('Not found: ' + (ea ? b : a));
      let el = ea;
      while (!el.contains(eb)) el = el.parentElement;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) };
    },
    [a, b]
  );

const pageHeight = () => page.evaluate(() => document.documentElement.scrollHeight);

const sections = {
  // Insights
  async insights() {
    await go('/');
    await shot('insights-top');
    await shot('insights-full', { fullPage: true });
    layout.insights = {
      height: await pageHeight(),
      graph: await page.evaluate(() => {
        const r = document.querySelector('.react-flow').getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) };
      }),
      range: await span('Showing', '6 months'),
      stats: await span('Median review turnaround', 'Open defects'),
      severity: await rect('Severity targets', 'section'),
      turnaround: await rect('Code review turnaround', 'section'),
      flow: await rect('Defects reported vs resolved', 'section'),
      outcomes: await rect('Review outcomes', 'section'),
      heatmap: await rect('Open defects by product line', 'section'),
      changeType: await rect('Turnaround by change type', 'section'),
      activeDefects: await rect('Most active defects', 'section'),
      reviewTeam: await rect('Code review team', 'section')
    };
    for (const [label, name] of [['7 days', 'insights-stats-7d'], ['90 days', 'insights-stats-90d'], ['6 months', 'insights-stats-6m'], ['30 days', 'insights-stats-30d']]) {
      await page.getByRole('button', { name: label }).or(page.getByRole('tab', { name: label })).or(page.getByRole('radio', { name: label })).first().click();
      await page.mouse.move(VW - 2, VH - 2);
      // Measure from the top: once scrolled, the period bar sticks to the top of the window.
      await page.evaluate(() => window.scrollTo(0, 0));
      await settle(500);
      const a = await span('Showing', '6 months'), b = await span('Median review turnaround', 'Open defects');
      const r = { x: b.x - 24, y: a.y - 16, w: b.w + 48, h: b.y + b.h - a.y + 32 };
      await shot(name, { fullPage: true, clip: { x: r.x, y: r.y, width: r.w, height: r.h } });
      layout.insights[name] = r;
    }
  },

  // Defects list: keyboard navigation and bulk selection
  async defects() {
    await go('/defects');
    await shot('defects-0');
    const keys = ['j', 'j', 'x', 'j', 'x', 'j', 'x'];
    for (let i = 0; i < keys.length; i++) {
      await page.keyboard.press(keys[i]);
      await settle(250);
      await shot('defects-' + (i + 1));
    }
    layout.defectsKeys = keys;
    await page.keyboard.press('Escape');
  },

  // Command palette
  async palette() {
    await go('/defects');
    await page.keyboard.press('Control+k');
    await settle(300);
    await shot('palette-0');
    const query = 'Jam 0x21';
    const stops = [3, 6, 8];
    for (let i = 0; i < stops.length; i++) {
      await page.keyboard.type(query.slice(i ? stops[i - 1] : 0, stops[i]), { delay: 40 });
      await settle(400);
      await shot('palette-' + (i + 1));
    }
    layout.palette = { query, stops, box: await page.evaluate(() => {
      const inp = document.activeElement.getBoundingClientRect();
      return { x: Math.round(inp.x), y: Math.round(inp.y), w: Math.round(inp.width), h: Math.round(inp.height) };
    }) };
    await page.keyboard.press('Escape');
  },

  // Report a defect: duplicate detection
  async newDefect() {
    await go('/defects/new');
    await shot('newdefect-0');
    const title = '[PS-C3150FR] 양면 인쇄 용지 걸림 0x21';
    const titleInput = page.getByRole('textbox', { name: 'Title' });
    await titleInput.click();
    const tstops = [12, 16, 19, 22, title.length];
    for (let i = 0; i < tstops.length; i++) {
      await page.keyboard.insertText(title.slice(i ? tstops[i - 1] : 0, tstops[i]));
      await settle(250);
      await shot('newdefect-' + (i + 1));
    }
    const model = page.getByRole('combobox', { name: 'Model' });
    await model.click();
    await page.keyboard.type('C3150', { delay: 40 });
    await settle(500);
    await shot('newdefect-' + (tstops.length + 1));
    await page.getByRole('option', { name: /PS-C3150FR/ }).click();
    await page.mouse.move(VW - 2, VH - 2);
    await settle(600);
    await shot('newdefect-' + (tstops.length + 2));
    layout.newDefect = {
      title,
      stops: tstops,
      frames: tstops.length + 3,
      titleBox: await titleInput.boundingBox(),
      modelBox: await model.boundingBox(),
      dupes: await rect('Possible duplicates on PS-C3150FR', 'div.flex.flex-col.gap-1\\.5')
    };
  },

  // Defect detail
  async defect() {
    const DEFECT = process.env.DRS_DEFECT || 'D-17-0363';
    await go('/defects/' + DEFECT);
    await shot('defect-top');
    await shot('defect-full', { fullPage: true });
    layout.defect = {
      id: DEFECT,
      height: await pageHeight(),
      title: await rect('[PS-C3150FR] 양면 인쇄 시 2페이지 이후 용지 걸림 (Jam 0x21) 발생', 'h1'),
      product: await span('Samsung ProXpress PS-C3150FR', 'Support status'),
      targets: await span('Critical severity targets', 'Was due Sep 13'),
      records: await rect('Records across systems', 'section'),
      relmap: await rect('Relationship map', 'section'),
      linked: await rect('Linked code reviews', 'section'),
      changelists: await rect('Perforce changelists', 'section'),
      activity: await rect('Activity', 'section')
    };
  },

  // Code review detail
  async review() {
    const REVIEW = process.env.DRS_REVIEW || 'CR-2225';
    await go('/reviews/' + REVIEW);
    await shot('review-top');
    await shot('review-full', { fullPage: true });
    layout.review = {
      id: REVIEW,
      height: await pageHeight(),
      title: await rect('Restore duplex reverse motor timing for PS-C3150FR (Jam 0x21)', 'h1'),
      turnaround: await span('Review turnaround', 'Submission to first decision, target 48h'),
      reviewers: await span('1 of 2 approved', 'Reviewing'),
      records: await rect('Records across systems', 'section'),
      diff: await rect('Changed files', 'section'),
      activity: await rect('Activity', 'section'),
      approved: await rect('LGTM. 타이밍 원복과 주석 추가 확인했습니다.')
    };
  },

  // Everything else
  async other() {
    await go('/digests');
    await shot('digests');
    await shot('digests-full', { fullPage: true });
    layout.digests = { height: await pageHeight() };
    await go('/notifications');
    await shot('notifications');
    await go('/teams');
    await shot('teams');
    await go('/reviews');
    await shot('reviews');
  }
};

for (const name of only.length ? only : Object.keys(sections)) {
  if (!sections[name]) throw new Error(`Unknown section "${name}". Sections: ${Object.keys(sections).join(', ')}`);
  await sections[name]();
}

writeFileSync(LAYOUT, JSON.stringify(layout, null, 2) + '\n');
console.log('layout written');
await browser.close();
