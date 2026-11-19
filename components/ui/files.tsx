import { useRef, type ChangeEvent } from 'react';
import type { Attachment } from '@/lib/types';
import { Button, type ButtonVariant } from './button';
import { Icon } from './icon';
import { cx } from '@/lib/cx';
import s from './files.module.css';

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
      <input ref={ref} type="file" multiple accept="image/*,video/*,.txt,.log,.pdf,.zip,.csv,.bin,.dmp,.pcapng" className={s.input} onChange={pick} />
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
    <div className={s.attachments}>
      {media.length ? (
        <div className={s.media}>
          {media.map(([a, i]) => {
            const k = kindOf(a);
            return (
              <div key={i} className={s.mediaItem}>
                <div className={s.mediaFrame}>
                  {a.url ? (
                    k === 'image' ? (
                      <a href={a.url} target="_blank" rel="noreferrer" className={s.mediaFill}>
                        <img src={a.url} alt={a.name} className={s.mediaImg} />
                      </a>
                    ) : (
                      <video src={a.url} controls className={s.mediaVideo} />
                    )
                  ) : (
                    <div className={s.mediaEmpty} title="Sample attachment (no file in this demo)">
                      <Icon name={k === 'image' ? 'image' : 'play'} size={24} />
                    </div>
                  )}
                </div>
                <div className={s.mediaCaption}>
                  <Icon name={k === 'image' ? 'image' : 'film'} size={14} color="var(--color-muted)" />
                  <span className={cx('bui-trunc', s.mediaName)} title={a.name}>{a.name}</span>
                  <span className={s.size}>{fmtSize(a.size)}</span>
                  {rm(i)}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      {files.map(([a, i]) => (
        <div key={i} className={s.file}>
          <Icon name="file-text" size={16} color="var(--color-muted)" />
          {a.url ? (
            <a href={a.url} download={a.name} className={cx('bui-trunc', s.fileName)}>{a.name}</a>
          ) : (
            <span className={cx('bui-trunc', s.fileName)}>{a.name}</span>
          )}
          <span className={s.size}>{fmtSize(a.size)}</span>
          {rm(i)}
        </div>
      ))}
    </div>
  );
}
