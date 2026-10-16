import React from 'react';
import { Img, staticFile } from 'remotion';
import { C, SANS } from '../theme';
import { DrsMark } from './Logo';
import { clampCam, type Cam, SCREEN_H, SCREEN_W, SIDEBAR_W } from './camera';

/** `mount` keeps a hidden shot loaded so it can appear without a load; it defaults to `on`. */
export type Shot = { src: string; on: boolean; mount?: boolean; style?: React.CSSProperties };

/**
 * The captured app viewport. Every image in `shots` is mounted (so swapping
 * between them never waits on a load) and only the ones marked `on` show.
 * `children` are drawn in page coordinates, `overlay` in screen coordinates.
 */
export const Screen: React.FC<{
  cam: Cam;
  shots: Shot[];
  /** Viewport capture of the same page; its sidebar stays fixed while the page scrolls. */
  sidebar?: string;
  children?: React.ReactNode;
  overlay?: React.ReactNode;
}> = ({ cam, shots, sidebar, children, overlay }) => {
  const k = clampCam(cam);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: SCREEN_W, height: SCREEN_H, overflow: 'hidden', background: '#fff' }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: SCREEN_W,
          height: SCREEN_H,
          transformOrigin: '0 0',
          transform: `translate(${SCREEN_W / 2}px, ${SCREEN_H / 2}px) scale(${k.zoom}) translate(${-k.fx}px, ${-k.fy}px)`
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: -cam.scroll, width: SCREEN_W }}>
          {shots.filter(s => s.mount ?? s.on).map(s => (
            <Img key={s.src} src={staticFile(s.src)} style={{ position: 'absolute', left: 0, top: 0, width: SCREEN_W, opacity: s.on ? 1 : 0, ...s.style }} />
          ))}
          {children}
        </div>
        {sidebar ? (
          <div style={{ position: 'absolute', left: 0, top: 0, width: SIDEBAR_W, height: SCREEN_H, overflow: 'hidden' }}>
            <Img src={staticFile(sidebar)} style={{ width: SCREEN_W, display: 'block' }} />
          </div>
        ) : null}
      </div>
      {overlay}
    </div>
  );
};

/** A browser window around a 1600x900 screen, drawn `width` pixels wide. */
export const BrowserWindow: React.FC<{
  width: number;
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ width, title, children, style }) => {
  const scale = width / SCREEN_W;
  const chrome = 46;
  return (
    <div
      style={{
        position: 'absolute',
        width,
        height: chrome + SCREEN_H * scale,
        borderRadius: 18,
        overflow: 'hidden',
        background: '#fff',
        boxShadow:
          '0 0 0 1px oklch(0.45 0.06 293 / 0.14), 0 2px 4px oklch(0.3 0.05 293 / 0.06), 0 40px 90px -24px oklch(0.32 0.14 293 / 0.38), 0 24px 40px -28px oklch(0.2 0.05 293 / 0.35)',
        ...style
      }}
    >
      <div
        style={{
          height: chrome,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          background: 'linear-gradient(#fdfcff, #f6f4fb)',
          borderBottom: `1px solid ${C.line}`,
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', gap: 9 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map(c => (
            <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c, boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.12)' }} />
          ))}
        </div>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            height: 30,
            padding: '0 18px 0 14px',
            borderRadius: 9,
            background: '#fff',
            boxShadow: '0 0 0 1px oklch(0.45 0.04 293 / 0.1)',
            fontFamily: SANS,
            fontSize: 15,
            fontWeight: 520,
            color: C.ink3,
            whiteSpace: 'nowrap'
          }}
        >
          <DrsMark size={18} still />
          {title}
        </div>
      </div>
      <div style={{ position: 'relative', width: SCREEN_W, height: SCREEN_H, transformOrigin: '0 0', transform: `scale(${scale})` }}>{children}</div>
    </div>
  );
};
