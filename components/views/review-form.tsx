'use client';

import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const sp = useSearchParams();
  if (!app) return <Loading />;
  const r = id ? app.data.reviews.find(x => x.id === id) : undefined;
  if (id && !r) return <NotFoundView />;
  return <ReviewFormInner key={id || 'new'} r={r} linkedDefect={sp.get('defect')} />;
}

function ReviewFormInner({ r, linkedDefect }: { r?: Review; linkedDefect: string | null }) {
  const app = useApp()!;
  const router = useRouter();
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
  const heading = clone ? 'Clone ' + clone.cloneOf : r ? 'Edit ' + r.id : 'Request a code review';
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
      router.push('/reviews/' + newId);
      flash(newId + ' sent to the code review team, Swarm review ' + p.swId);
    } else if (r) {
      updReview(r.id, x => ({ ...x, title: f.title.trim(), type: f.type, branch: f.branch.trim(), cl, linked: f.linked || '', desc: f.desc, attachments: f.attachments, activity: [...x.activity, A('e', meId, at, 'edited the request')] }));
      router.push('/reviews/' + r.id);
      flash('Changes saved');
    }
  };

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-8">
      <div className="flex flex-col gap-3.5">
        <div className="flex"><NextLink href={back} className="bui-btn bui-link"><Icon name="arrow-left" size={16} />{r ? r.id : 'Code reviews'}</NextLink></div>
        <h1 className="text-2xl font-bold tracking-[-0.02em]">{heading}</h1>
      </div>
      <div className="flex flex-col gap-6">
        <Field label="Title"><Input value={f.title} onChange={v => set('title', v)} placeholder="What does this change do?" ariaLabel="Title" /></Field>
        <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
          <Field label="Change type"><Select ariaLabel="Change type" items={typeItems} value={f.type} onValueChange={v => set('type', v)} /></Field>
          <Field label="Linked defect"><Combobox items={defectItems} limit={40} value={f.linked} onValueChange={v => set('linked', v)} placeholder="Search by ID or title" ariaLabel="Linked defect" /></Field>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-ink-4">Perforce stream</span>
          <Input icon="git-branch" mono value={f.branch} onChange={v => set('branch', v)} placeholder="fw/model/short-description" ariaLabel="Perforce stream" />
          <span className="text-sm text-muted">Mapped under //depot/printing/</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-ink-4">Shelved changelist</span>
          <Input icon="git-commit" mono value={f.cl} onChange={v => set('cl', v)} placeholder="e.g. 1492310 (leave empty to shelve automatically)" ariaLabel="Shelved changelist" />
          <span className="mt-1 flex items-center gap-2 text-sm text-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/perforce.svg" alt="" className="block h-3.5 w-auto flex-none" />
            A Helix Swarm review is created from this shelved changelist when you send the request.
          </span>
        </div>
        <Field label="Summary of change"><Textarea value={f.desc} onChange={v => set('desc', v)} rows={6} placeholder="What changed, why, and how it was tested" ariaLabel="Summary of change" /></Field>
        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold text-ink-4">Attachments</span>
          <span className="text-sm text-muted">Test reports, screenshots, videos and logs</span>
          <Attachments items={f.attachments} onRemove={i => set('attachments', f.attachments.filter((_, j) => j !== i))} />
          <div className="flex"><FileButton onFiles={list => set('attachments', [...f.attachments, ...list])}>Add files</FileButton></div>
        </div>
        {err ? <span className="border-l-[3px] border-danger-rule py-1 pl-3.5 text-danger" role="alert">{err}</span> : null}
      </div>
      <div className="flex justify-end gap-2.5 border-t border-line pt-6">
        <Button variant="secondary" onClick={() => router.push(back)}>Cancel</Button>
        <Button variant="primary" icon="check" onClick={save}>{mode === 'new' ? 'Send for review' : 'Save changes'}</Button>
      </div>
    </div>
  );
}
