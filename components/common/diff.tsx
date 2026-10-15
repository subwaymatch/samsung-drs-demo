'use client';

import { Fragment, useMemo, useState } from 'react';
import { fAt } from '@/lib/dates';
import { av } from '@/lib/people';
import { diffRows, type HunkRow, type SbsRow, type UniRow } from '@/lib/records';
import type { FileDiff, LineComment, Option } from '@/lib/types';
import { Button } from '../ui/button';
import { MentionTextarea } from '../ui/fields';
import { Icon } from '../ui/icon';
import { Person } from '../ui/person';
import { RichText } from './detail';

const CELL_NO = 'pr-2.5 text-right text-[oklch(0.62_0.015_290)] select-none';
const CODE = 'whitespace-pre-wrap break-all';

function Thread({ comments }: { comments: LineComment[] }) {
  return (
    <>
      {comments.map((c, i) => {
        const who = av(c.u);
        return (
          <div key={i} className="flex items-start gap-3 border-y border-l-[3px] border-y-line border-l-[oklch(0.6_0.16_293)] bg-white px-4 py-3 font-sans text-sm">
            <Person person={who} size={24} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-baseline gap-2.5"><strong className="font-semibold">{who.name}</strong><span className="text-sm text-muted">{fAt(c.at)}</span></div>
              <div className="leading-[1.6] whitespace-pre-wrap"><RichText text={c.x} /></div>
            </div>
          </div>
        );
      })}
    </>
  );
}

function Compose({ no, people, onSave, onCancel }: { no: number; people: Option[]; onSave: (t: string) => void; onCancel: () => void }) {
  const [t, setT] = useState('');
  return (
    <div className="flex flex-col gap-2.5 border-y border-l-[3px] border-y-line border-l-[oklch(0.6_0.16_293)] bg-white px-4 py-3 font-sans text-sm">
      <span className="text-sm text-muted">Comment on line {no}</span>
      <MentionTextarea value={t} onChange={setT} people={people} rows={2} placeholder="Comment on this line. Type @ to mention someone." ariaLabel={'Comment on line ' + no} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="sm" icon="send" onClick={() => { if (t.trim()) onSave(t.trim()); }}>Comment</Button>
      </div>
    </div>
  );
}

export function DiffFile({ f, fi, mode, comments, people, onComment }: {
  f: FileDiff;
  fi: number;
  mode: 'sbs' | 'uni';
  comments: LineComment[];
  people: Option[];
  onComment: (fi: number, key: string, no: number, text: string) => void;
}) {
  const rows = useMemo(() => diffRows(f), [f]);
  const [composing, setComposing] = useState<string | null>(null);
  const mine = comments.filter(c => c.f === fi);
  const after = (row: UniRow | SbsRow) => (
    <>
      <Thread comments={mine.filter(c => c.key === row.key)} />
      {composing === row.key ? (
        <Compose no={row.no} people={people} onCancel={() => setComposing(null)} onSave={t => { onComment(fi, row.key, row.no, t); setComposing(null); }} />
      ) : null}
    </>
  );
  const hunk = (r: HunkRow, i: number) => <div key={'h' + i} className="bg-[oklch(0.975_0.015_293)] px-3 py-1 text-[oklch(0.5_0.1_293)]">{r.text}</div>;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5 font-mono text-sm">
        <Icon name="file-code" size={16} color="var(--color-muted)" />
        <span title={'//depot/printing/main/' + f.path} className="bui-trunc min-w-0 flex-1">{'//depot/printing/main/' + f.path}</span>
        {mine.length ? <span className="flex items-center gap-1 text-muted"><Icon name="message-square" size={14} />{mine.length}</span> : null}
        <span className="text-[oklch(0.48_0.12_155)]">+{f.add}</span>
        <span className="text-[oklch(0.52_0.16_25)]">−{f.del}</span>
      </div>
      <div className="overflow-x-auto rounded border border-line font-mono text-sm leading-[1.75]">
        {mode === 'sbs' ? (
          <div className="min-w-[760px]">
            {rows.sbs.map((r, i) =>
              r.isHunk ? hunk(r, i) : (
                <Fragment key={r.key + i}>
                  <div
                    role="button"
                    tabIndex={0}
                    title="Comment on this line"
                    onClick={() => setComposing(r.key)}
                    onKeyDown={e => { if (e.key === 'Enter') setComposing(r.key); }}
                    className="grid cursor-pointer grid-cols-[48px_minmax(0,1fr)_48px_minmax(0,1fr)] hover:shadow-[inset_0_0_0_1px_oklch(0.78_0.1_293)]"
                  >
                    <span className={CELL_NO} style={{ background: r.lbg }}>{r.ln}</span>
                    <span className={CODE + ' border-r border-line pr-3 pl-1'} style={{ background: r.lbg, color: r.lfg }}>{r.lt}</span>
                    <span className={CELL_NO} style={{ background: r.rbg }}>{r.rn}</span>
                    <span className={CODE + ' pr-3 pl-1'} style={{ background: r.rbg, color: r.rfg }}>{r.rt}</span>
                  </div>
                  {after(r)}
                </Fragment>
              )
            )}
          </div>
        ) : (
          <div className="min-w-[640px]">
            {rows.uni.map((r, i) =>
              r.isHunk ? hunk(r, i) : (
                <Fragment key={r.key + i}>
                  <div
                    role="button"
                    tabIndex={0}
                    title="Comment on this line"
                    onClick={() => setComposing(r.key)}
                    onKeyDown={e => { if (e.key === 'Enter') setComposing(r.key); }}
                    className="grid cursor-pointer grid-cols-[48px_48px_24px_minmax(0,1fr)] hover:shadow-[inset_0_0_0_1px_oklch(0.78_0.1_293)]"
                    style={{ background: r.bg, color: r.fg }}
                  >
                    <span className={CELL_NO}>{r.ln}</span>
                    <span className={CELL_NO}>{r.rn}</span>
                    <span className="text-center opacity-70 select-none">{r.sign}</span>
                    <span className={CODE + ' pr-4'}>{r.text}</span>
                  </div>
                  {after(r)}
                </Fragment>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const DIFF_MODES: Option[] = [{ value: 'sbs', label: 'Side by side', icon: 'columns-2' }, { value: 'uni', label: 'Unified', icon: 'align-justify' }];
