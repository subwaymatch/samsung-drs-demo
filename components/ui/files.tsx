'use client';

import { useRef, type ChangeEvent } from 'react';
import type { Attachment } from '@/lib/types';
import { Button, type ButtonVariant } from './button';
import { Icon } from './icon';

/** Small images are kept as data URLs so they survive a reload; larger files only for this session. */
const readFile = (f: File) =>
  new Promise<Attachment>(res => {
    const meta = { name: f.name, size: f.size, type: f.type || '' };
    if (meta.type.startsWith('image/') && f.size <= 900000) {
      const r = new FileReader();
      r.onload = () => res({ ...meta, url: String(r.result) });
      r.onerror = () => res({ ...meta, url: URL.createObjectURL(f), temp: true });
      r.readAsDataURL(f);
    } else res({ ...meta, url: URL.createObjectURL(f), temp: true });
  });

export function FileButton({ onFiles, children, size, variant = 'secondary' }: { onFiles: (a: Attachment[]) => void; children: React.ReactNode; size?: 'sm'; variant?: ButtonVariant }) {
  const ref = useRef<HTMLInputElement>(null);
  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const fs = [...(e.target.files || [])];
    e.target.value = '';
    Promise.all(fs.map(readFile)).then(a => { if (a.length) onFiles(a); });
  };
  return (
    <>
      <Button variant={variant} size={size} icon="paperclip" onClick={() => ref.current?.click()}>
        {children}
      </Button>
      <input ref={ref} type="file" multiple accept="image/*,video/*,.txt,.log,.pdf,.zip,.csv,.bin,.dmp,.pcapng" className="hidden" onChange={pick} />
    </>
  );
}

const fmtSize = (b: number) => (b >= 1e6 ? (b / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB');
const kindOf = (a: Attachment) => ((a.type || '').startsWith('image/') ? 'image' : (a.type || '').startsWith('video/') ? 'video' : 'file');

export function Attachments({ items, onRemove }: { items: Attachment[]; onRemove?: (i: number) => void }) {
  if (!items || !items.length) return null;
  const media: [Attachment, number][] = [], files: [Attachment, number][] = [];
  items.forEach((a, i) => (kindOf(a) === 'file' ? files : media).push([a, i]));
  const rm = (i: number) =>
    onRemove ? (
      <button type="button" className="bui-chip-x" title="Remove" onClick={e => { e.preventDefault(); e.stopPropagation(); onRemove(i); }}>
        <Icon name="x" size={14} />
      </button>
    ) : null;
  return (
    <div className="flex flex-col gap-3">
      {media.length ? (
        <div className="flex flex-wrap gap-4">
          {media.map(([a, i]) => {
            const k = kindOf(a);
            return (
              <div key={i} className="flex w-[184px] flex-col gap-2">
                <div className="h-[120px] w-[184px] overflow-hidden rounded border border-[oklch(0.92_0.01_290)]">
                  {a.url ? (
                    k === 'image' ? (
                      <a href={a.url} target="_blank" rel="noreferrer" className="block h-full w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.url} alt={a.name} className="block h-full w-full object-cover" />
                      </a>
                    ) : (
                      <video src={a.url} controls className="block h-full w-full bg-black object-cover" />
                    )
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-[oklch(0.985_0.006_293)] text-[oklch(0.6_0.08_293)]" title="Sample attachment (no file in this demo)">
                      <Icon name={k === 'image' ? 'image' : 'play'} size={24} />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 items-center gap-1.5">
                  <Icon name={k === 'image' ? 'image' : 'film'} size={14} color="var(--color-muted)" />
                  <span className="bui-trunc min-w-0 flex-1" title={a.name}>{a.name}</span>
                  <span className="whitespace-nowrap text-muted">{fmtSize(a.size)}</span>
                  {rm(i)}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      {files.map(([a, i]) => (
        <div key={i} className="flex min-w-0 items-center gap-2.5">
          <Icon name="file-text" size={16} color="var(--color-muted)" />
          {a.url ? (
            <a href={a.url} download={a.name} className="bui-trunc min-w-0">{a.name}</a>
          ) : (
            <span className="bui-trunc min-w-0">{a.name}</span>
          )}
          <span className="whitespace-nowrap text-muted">{fmtSize(a.size)}</span>
          {rm(i)}
        </div>
      ))}
    </div>
  );
}
