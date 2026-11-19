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
import { cx } from '@/lib/cx';
import s from './diff.module.css';

function Thread({ comments }: { comments: LineComment[] }) {
  return (
    <>
      {comments.map((c, i) => {
        const who = av(c.u);
        return (
          <div key={i} className={s.comment}>
            <Person person={who} size={24} />
            <div className={s.commentBody}>
              <div className={s.commentHead}><strong className={s.commentAuthor}>{who.name}</strong><span className={s.commentMeta}>{fAt(c.at)}</span></div>
              <div className={s.commentText}><RichText text={c.x} /></div>
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
    <div className={s.compose}>
      <span className={s.commentMeta}>Comment on line {no}</span>
      <MentionTextarea value={t} onChange={setT} people={people} rows={2} placeholder="Comment on this line. Type @ to mention someone." ariaLabel={'Comment on line ' + no} />
      <div className={s.composeActions}>
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
  const hunk = (r: HunkRow, i: number) => <div key={'h' + i} className={s.hunk}>{r.text}</div>;
  return (
    <div className={s.file}>
      <div className={s.fileHeader}>
        <Icon name="file-code" size={16} color="var(--color-muted)" />
        <span title={'//depot/printing/main/' + f.path} className={cx('bui-trunc', s.filePath)}>{'//depot/printing/main/' + f.path}</span>
        {mine.length ? <span className={s.commentCount}><Icon name="message-square" size={14} />{mine.length}</span> : null}
        <span className={s.added}>+{f.add}</span>
        <span className={s.removed}>-{f.del}</span>
      </div>
      <div className={s.diff}>
        {mode === 'sbs' ? (
          <div className={s.sbs}>
            {rows.sbs.map((r, i) =>
              r.isHunk ? hunk(r, i) : (
                <Fragment key={r.key + i}>
                  <div
                    role="button"
                    tabIndex={0}
                    title="Comment on this line"
                    onClick={() => setComposing(r.key)}
                    onKeyDown={e => { if (e.key === 'Enter') setComposing(r.key); }}
                    className={s.sbsRow}
                  >
                    <span className={s.lineNo} style={{ background: r.lbg }}>{r.ln}</span>
                    <span className={s.sbsOld} style={{ background: r.lbg, color: r.lfg }}>{r.lt}</span>
                    <span className={s.lineNo} style={{ background: r.rbg }}>{r.rn}</span>
                    <span className={s.sbsNew} style={{ background: r.rbg, color: r.rfg }}>{r.rt}</span>
                  </div>
                  {after(r)}
                </Fragment>
              )
            )}
          </div>
        ) : (
          <div className={s.uni}>
            {rows.uni.map((r, i) =>
              r.isHunk ? hunk(r, i) : (
                <Fragment key={r.key + i}>
                  <div
                    role="button"
                    tabIndex={0}
                    title="Comment on this line"
                    onClick={() => setComposing(r.key)}
                    onKeyDown={e => { if (e.key === 'Enter') setComposing(r.key); }}
                    className={s.uniRow}
                    style={{ background: r.bg, color: r.fg }}
                  >
                    <span className={s.lineNo}>{r.ln}</span>
                    <span className={s.lineNo}>{r.rn}</span>
                    <span className={s.sign}>{r.sign}</span>
                    <span className={s.uniText}>{r.text}</span>
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
