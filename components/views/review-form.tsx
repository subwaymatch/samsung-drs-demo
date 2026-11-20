import { Link, useNavigate, useSearchParams } from 'react-router';
import { useMemo, useState } from 'react';
import { SEV, TYPES, TYPE_ICON } from '@/lib/constants';
import { takeDraft } from '@/lib/drafts';
import { nowStr } from '@/lib/dates';
import { A, crNum, p4Of } from '@/lib/records';
import { addReview, updReview, useApp } from '@/lib/store';
import type { Attachment, Review } from '@/lib/types';
import { Loading } from '../common/basics';
import { useShell } from '../shell/shell-context';
import { Button } from '../ui/button';
import { Combobox } from '../ui/combobox';
import { Input, Textarea } from '../ui/fields';
import { Attachments, FileButton } from '../ui/files';
import { Icon } from '../ui/icon';
import { Select } from '../ui/select';
import { Field } from './defect-form';
import { NotFoundView } from './not-found-view';
import s from './review-form.module.css';

interface Form {
  title: string;
  type: string;
  branch: string;
  cl: string;
  linked: string | null;
  desc: string;
  attachments: Attachment[];
}

export function ReviewForm({ id }: { id?: string }) {
  const app = useApp();
  const [sp] = useSearchParams();
  if (!app) return <Loading />;
  const r = id ? app.data.reviews.find(x => x.id === id) : undefined;
  if (id && !r) return <NotFoundView back={{ href: '/reviews', label: 'Code Reviews' }} />;
  return <ReviewFormInner key={id || 'new'} r={r} linkedDefect={sp.get('defect')} />;
}

function ReviewFormInner({ r, linkedDefect }: { r?: Review; linkedDefect: string | null }) {
  const app = useApp()!;
  const navigate = useNavigate();
  const { flash } = useShell();
  const meId = app.prefs.meId;
  const [clone] = useState(() => (r ? null : takeDraft('review')));
  const [f, setF] = useState<Form>(() =>
    r
      ? { title: r.title, type: r.type, branch: r.branch, cl: r.cl || '', linked: r.linked || null, desc: r.desc, attachments: [...r.attachments] }
      : clone
        ? { title: clone.title + ' (clone)', type: clone.type, branch: clone.branch, cl: '', linked: clone.linked, desc: clone.desc, attachments: [] }
        : { title: '', type: 'Bug fix', branch: '', cl: '', linked: linkedDefect && app.data.defects.some(d => d.id === linkedDefect) ? linkedDefect : null, desc: '', attachments: [] }
  );
  const [err, setErr] = useState('');
  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setF(x => ({ ...x, [k]: v })); setErr(''); };
  const typeItems = useMemo(() => TYPES.map(t => ({ value: t, label: t, icon: TYPE_ICON[t], color: 'oklch(0.5 0.12 293)' })), []);
  const defectItems = useMemo(() => app.data.defects.map(x => ({ value: x.id, label: x.id + ', ' + x.title, icon: SEV[x.sev].icon, color: SEV[x.sev].c })), [app.data.defects]);
  const mode = r ? 'edit' : 'new';
  const heading = clone ? 'Clone ' + clone.cloneOf : r ? 'Edit ' + r.id : 'Request a Code Review';
  const back = r ? '/reviews/' + r.id : '/reviews';

  const save = () => {
    if (!f.title.trim()) return setErr('Title is required.');
    if (!f.branch.trim()) return setErr('Perforce stream is required.');
    const cl = f.cl.trim();
    if (cl && !/^\d{6,8}$/.test(cl)) return setErr('Changelist must be 6 to 8 digits.');
    const at = nowStr();
    if (mode === 'new') {
      const n = Math.max(0, ...app.data.reviews.map(x => crNum(x.id))) + 1;
      const newId = 'CR-' + n;
      const rv: Review = { id: newId, title: f.title.trim(), type: f.type, branch: f.branch.trim(), cl, author: meId, reviewers: [], status: 'pending', linked: f.linked || '', submitted: at, desc: f.desc.trim(), files: [], attachments: f.attachments, activity: [] };
      const p = p4Of(rv);
      rv.activity = [A('e', meId, at, 'requested a code review'), A('e', meId, at, `shelved changelist ${p.shelved} and opened Helix Swarm review ${p.swId}`)];
      addReview(rv);
      navigate('/reviews/' + newId);
      flash(newId + ' sent to the code review team, Swarm review ' + p.swId);
    } else if (r) {
      updReview(r.id, x => ({ ...x, title: f.title.trim(), type: f.type, branch: f.branch.trim(), cl, linked: f.linked || '', desc: f.desc, attachments: f.attachments, activity: [...x.activity, A('e', meId, at, 'edited the request')] }));
      navigate('/reviews/' + r.id);
      flash('Changes saved');
    }
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className={s.buttonRow}><Link to={back} className="bui-btn bui-link"><Icon name="arrow-left" size={16} />{r ? r.id : 'Code Reviews'}</Link></div>
        <h1 className={s.title}>{heading}</h1>
      </div>
      <div className={s.fields}>
        <Field label="Title"><Input value={f.title} onChange={v => set('title', v)} placeholder="What does this change do?" ariaLabel="Title" /></Field>
        <div className={s.fieldGrid}>
          <Field label="Change type"><Select ariaLabel="Change type" items={typeItems} value={f.type} onValueChange={v => set('type', v)} /></Field>
          <Field label="Linked defect"><Combobox items={defectItems} limit={40} value={f.linked} onValueChange={v => set('linked', v)} placeholder="Search by ID or title" ariaLabel="Linked defect" /></Field>
        </div>
        <div className={s.field}>
          <span className={s.label}>Perforce stream</span>
          <Input icon="git-branch" mono value={f.branch} onChange={v => set('branch', v)} placeholder="fw/model/short-description" ariaLabel="Perforce stream" />
          <span className={s.sub}>Mapped under //depot/printing/</span>
        </div>
        <div className={s.field}>
          <span className={s.label}>Shelved changelist</span>
          <Input icon="git-commit" mono value={f.cl} onChange={v => set('cl', v)} placeholder="e.g. 1492310 (leave empty to shelve automatically)" ariaLabel="Shelved changelist" />
          <span className={s.swarmNote}>
            <img src="/logos/perforce.svg" alt="" className={s.swarmLogo} />
            A Helix Swarm review is created from this shelved changelist when you send the request.
          </span>
        </div>
        <Field label="Summary of change"><Textarea value={f.desc} onChange={v => set('desc', v)} rows={6} placeholder="What changed, why, and how it was tested" ariaLabel="Summary of change" /></Field>
        <div className={s.attachments}>
          <span className={s.label}>Attachments</span>
          <span className={s.sub}>Test reports, screenshots, videos and logs</span>
          <Attachments items={f.attachments} onRemove={i => set('attachments', f.attachments.filter((_, j) => j !== i))} />
          <div className={s.buttonRow}><FileButton onFiles={list => set('attachments', [...f.attachments, ...list])}>Add files</FileButton></div>
        </div>
        {err ? <span className={s.formError} role="alert">{err}</span> : null}
      </div>
      <div className={s.actions}>
        <Button variant="secondary" onClick={() => navigate(back)}>Cancel</Button>
        <Button variant="primary" icon="check" onClick={save}>{mode === 'new' ? 'Send for review' : 'Save changes'}</Button>
      </div>
    </div>
  );
}
