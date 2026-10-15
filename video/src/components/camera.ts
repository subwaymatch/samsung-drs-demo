import { EASE } from '../theme';

/** Size of the captured app viewport, in CSS pixels. */
export const SCREEN_W = 1600;
export const SCREEN_H = 900;
/** Width of the app's sidebar, which stays put while the page scrolls. */
export const SIDEBAR_W = 248;

export type Rect = { x: number; y: number; w: number; h: number };

/**
 * A virtual camera over a captured page. `scroll` scrolls the page (the sidebar
 * stays fixed), then the viewport is zoomed by `zoom` around the viewport point
 * (`fx`, `fy`), which lands in the middle of the screen.
 */
export type Cam = { scroll: number; zoom: number; fx: number; fy: number };
export type CamKey = { at: number } & Partial<Cam>;

export const CAM0: Cam = { scroll: 0, zoom: 1, fx: SCREEN_W / 2, fy: SCREEN_H / 2 };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Camera at `frame`, eased between keyframes; fields left out of a key carry over. */
export function camAt(frame: number, keys: CamKey[]): Cam {
  let prev: Cam = CAM0;
  const full = keys.map(k => {
    const { at, ...rest } = k;
    prev = { ...prev, ...Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)) };
    return { at, ...prev };
  });
  if (!full.length) return CAM0;
  if (frame <= full[0].at) return full[0];
  for (let i = 0; i < full.length - 1; i++) {
    const a = full[i], b = full[i + 1];
    if (frame < b.at) {
      const t = EASE((frame - a.at) / (b.at - a.at));
      return {
        scroll: lerp(a.scroll, b.scroll, t),
        // Zoom eases in log space so zooming in and out feel equally fast.
        zoom: Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), t)),
        fx: lerp(a.fx, b.fx, t),
        fy: lerp(a.fy, b.fy, t)
      };
    }
  }
  return full[full.length - 1];
}

/** Keep the zoomed viewport inside the screen. */
export function clampCam(c: Cam): Cam {
  const hw = SCREEN_W / 2 / c.zoom, hh = SCREEN_H / 2 / c.zoom;
  return { ...c, fx: clamp(c.fx, hw, SCREEN_W - hw), fy: clamp(c.fy, hh, SCREEN_H - hh) };
}

/** Screen position of a page point. Pass `fixed` for points in the sidebar. */
export function toScreen(c: Cam, x: number, y: number, fixed = false) {
  const k = clampCam(c);
  return { x: (x - k.fx) * k.zoom + SCREEN_W / 2, y: (y - (fixed ? 0 : c.scroll) - k.fy) * k.zoom + SCREEN_H / 2 };
}

export function rectToScreen(c: Cam, r: Rect, fixed = false): Rect {
  const a = toScreen(c, r.x, r.y, fixed);
  return { x: a.x, y: a.y, w: r.w * c.zoom, h: r.h * c.zoom };
}

/** Camera that frames page rect `r` with `pad` around it, at the given scroll. */
export function frame(r: Rect, scroll: number, pad = 48, max = 2.1): Omit<Cam, never> {
  const zoom = Math.min(max, SCREEN_W / (r.w + 2 * pad), SCREEN_H / (r.h + 2 * pad));
  return { scroll, zoom: Math.max(1, zoom), fx: r.x + r.w / 2, fy: r.y + r.h / 2 - scroll };
}

/** Union of rects. */
export function union(...rs: Rect[]): Rect {
  const x = Math.min(...rs.map(r => r.x)), y = Math.min(...rs.map(r => r.y));
  return { x, y, w: Math.max(...rs.map(r => r.x + r.w)) - x, h: Math.max(...rs.map(r => r.y + r.h)) - y };
}

export const pad = (r: Rect, px: number, py = px): Rect => ({ x: r.x - px, y: r.y - py, w: r.w + 2 * px, h: r.h + 2 * py });
