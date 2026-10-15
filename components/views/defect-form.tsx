'use client';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { COMPS, DST, MM, UM } from '@/lib/constants';
import { takeDraft } from '@/lib/drafts';
import { fFull, nowStr, TODAY } from '@/lib/dates';
import { engineerOptions } from '@/lib/people';
import { affFromVals, affOf, affToVals, lineOptions, modelOptions } from '@/lib/products';
import { A, cqOf, jobOf, simil, toks } from '@/lib/records';
import { addDefect, updDefect, useApp } from '@/lib/store';
import type { Attachment, Defect, DefectStatus, Severity } from '@/lib/types';
import { Loading } from '../common/basics';
import { useShell } from '../shell/shell-context';
import { Button } from '../ui/button';
import { Combobox, MultiCombobox } from '../ui/combobox';
import { Input, Textarea } from '../ui/fields';
import { Attachments, FileButton } from '../ui/files';
import { Icon } from '../ui/icon';
import { Segmented } from '../ui/toggles';
import { dStatusOptions, sevOptions } from './defects-list';
import { NotFoundView } from './not-found-view';

interface Form {
  title: string;
  model: string | null;
  comp: string | null;
  aff: string[];
  sev: Severity;
  status: DefectStatus;
  fw: string;
  desc: string;
  steps: string;
  assignees: string[];
  attachments: Attachment[];
}

export const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    {hint ? (
      <div className="flex flex-col gap-0.5"><span className="text-sm font-semibold text-ink-4">{label}</span><span className="text-sm text-pretty text-muted">{hint}</span></div>
    ) : (
      <span className="text-sm font-semibold text-ink-4">{label}</span>
    )}
    {children}
  </div>
);

export function DefectForm({ id }: { id?: string }) {
  const app = useApp();
  if (!app) return <Loading />;
  const d = id ? app.data.defects.find(x => x.id === id) : undefined;
  if (id && !d) return <NotFoundView />;
  return <DefectFormInner key={id || 'new'} d={d} />;
}

function DefectFormInner({ d }: { d?: Defect }) {
  const app = useApp()!;
  const router = useRouter();
  const { flash } = useShell();
  const meId = app.prefs.meId;
  const [clone] = useState(() => (d ? null : takeDraft('defect')));
  const [f, setF] = useState<Form>(() =>
    d
      ? { title: d.title, model: d.model, comp: d.comp, aff: affToVals(affOf(d)), sev: d.sev, status: d.status, fw: d.fw, desc: d.desc, steps: d.steps, assignees: [...d.assignees], attachments: [...d.attachments] }
      : clone
        ? { title: clone.title + ' (clone)', model: clone.model, comp: clone.comp, aff: clone.aff, sev: clone.sev as Severity, status: 'open', fw: clone.fw, desc: clone.desc, steps: clone.steps, assignees: clone.assignees, attachments: [] }
        : { title: '', model: null, comp: null, aff: [], sev: 'major', status: 'open', fw: '', desc: '', steps: '', assignees: [], attachments: [] }
  );
  const [err, setErr] = useState('');
  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setF(x => ({ ...x, [k]: v })); setErr(''); };
  const models = useMemo(() => modelOptions(), []);
  const comps = useMemo(() => COMPS.map(c => ({ value: c, label: c })), []);
  const affItems = useMemo(() => [...lineOptions(), ...modelOptions().filter(m => m.value !== f.model)], [f.model]);
  const engItems = useMemo(() => engineerOptions(), []);
  const dupes = useMemo(() => {
    if (!f.model || f.title.trim().length < 4) return [];
    const tk = toks(f.title);
    return app.data.defects
      .filter(x => x.model === f.model && x.id !== d?.id)
      .map(x => ({ x, s: simil(tk, toks(x.title)) }))
      .filter(o => o.s >= 0.5)
      .sort((a, b) => b.s - a.s)
      .slice(0, 5)
      .map(o => o.x);
  }, [app.data.defects, f.model, f.title, d]);

  const mode = d ? 'edit' : 'new';
  const heading = clone ? 'Clone ' + clone.cloneOf : d ? 'Edit ' + d.id : 'Report a defect';
  const back = d ? '/defects/' + d.id : '/defects';

  const save = () => {
    if (!f.title.trim()) return setErr('Title is required.');
    if (!f.model) return setErr('Choose a model.');
    if (!f.comp) return setErr('Choose a component.');
    if (!f.desc.trim()) return setErr('Description is required.');
    const at = nowStr();
    if (mode === 'new') {
      const yy = TODAY.slice(2, 4);
      const n = Math.max(0, ...app.data.defects.filter(x => x.id.startsWith('D-' + yy + '-')).map(x => +x.id.slice(5))) + 1;
      const newId = 'D-' + yy + '-' + String(n).padStart(4, '0');
      const act = [
        A('e', meId, at, 'reported this defect'), A('e', meId, at, 'created Perforce job ' + jobOf(newId)),
        A('e', meId, at, 'submitted ClearQuest record ' + cqOf(newId)), ...f.assignees.map(u => A('e', meId, at, 'assigned ' + UM[u].name))
      ];
      addDefect({
        id: newId, title: f.title.trim(), affects: affFromVals(f.aff, f.model), model: f.model, comp: f.comp, sev: f.sev, status: f.status,
        fw: f.fw.trim() || '-', reporter: meId, assignees: f.assignees, created: at, desc: f.desc.trim(), steps: f.steps.trim(), attachments: f.attachments, activity: act
      });
      router.push('/defects/' + newId);
      flash(newId + ' reported · P4 job ' + jobOf(newId) + ' created');
    } else if (d) {
      updDefect(d.id, x => ({
        ...x, title: f.title.trim(), affects: affFromVals(f.aff, f.model), model: f.model!, comp: f.comp!, sev: f.sev, status: f.status, fw: f.fw,
        desc: f.desc, steps: f.steps, assignees: f.assignees, attachments: f.attachments, activity: [...x.activity, A('e', meId, at, 'edited the defect')]
      }));
      router.push('/defects/' + d.id);
      flash('Changes saved');
    }
  };

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-8">
      <div className="flex flex-col gap-3.5">
        <div className="flex"><NextLink href={back} className="bui-btn bui-link"><Icon name="arrow-left" size={16} />{d ? d.id : 'Defects'}</NextLink></div>
        <h1 className="text-2xl font-bold tracking-[-0.02em]">{heading}</h1>
      </div>
      <div className="flex flex-col gap-6">
        <Field label="Title"><Input value={f.title} onChange={v => set('title', v)} placeholder="[모델명] 증상 요약 / Short summary of the issue" ariaLabel="Title" /></Field>
        <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
          <Field label="Reported on"><Combobox items={models} value={f.model} onValueChange={v => set('model', v)} placeholder="Type a model, e.g. SL-M4080FX" ariaLabel="Model" /></Field>
          <Field label="Component"><Combobox items={comps} value={f.comp} onValueChange={v => set('comp', v)} placeholder="Type to search" ariaLabel="Component" /></Field>
        </div>
        <Field label="Also affects" hint="Add a whole product line when the defect is in shared firmware, or pick individual models.">
          <MultiCombobox items={affItems} value={f.aff} onValueChange={v => set('aff', v)} placeholder="Search product lines and models" ariaLabel="Also affects" />
        </Field>
        <div className="flex flex-col gap-2">
          {dupes.length ? (
            <div className="mb-4 flex flex-col gap-1.5 border-l-[3px] border-[oklch(0.73_0.16_55)] py-1 pl-4">
              <span className="flex items-center gap-2 font-[650]"><Icon name="copy" size={16} color="oklch(0.55 0.15 55)" />Possible duplicates on {f.model}</span>
              <span className="mb-1 text-sm text-muted">Check these before reporting. Each opens in a new tab so you keep this form.</span>
              {dupes.map(x => (
                <a key={x.id} href={'/defects/' + x.id} target="_blank" rel="noreferrer" className="grid grid-cols-[96px_minmax(0,1fr)_auto] items-center gap-3.5 border-b border-line-soft py-2.5 text-inherit no-underline last:border-b-0 hover:text-accent-text hover:no-underline">
                  <span className="font-mono text-sm text-muted">{x.id}</span>
                  <span className="flex min-w-0 flex-col gap-[3px]"><span className="bui-trunc">{x.title}</span><span className="text-sm text-muted">{x.comp} · reported {fFull(x.created)}</span></span>
                  <span className="flex items-center gap-1.5 font-[550] whitespace-nowrap" style={{ color: DST[x.status].fg }}><Icon name={DST[x.status].icon} size={14} />{DST[x.status].l}</span>
                </a>
              ))}
            </div>
          ) : null}
          <span className="text-sm font-semibold text-ink-4">Severity</span>
          <div className="max-w-full overflow-x-auto"><Segmented ariaLabel="Severity" items={sevOptions()} value={f.sev} onValueChange={v => set('sev', v as Severity)} /></div>
        </div>
        <Field label="Status"><div className="max-w-full overflow-x-auto"><Segmented ariaLabel="Status" items={dStatusOptions()} value={f.status} onValueChange={v => set('status', v as DefectStatus)} /></div></Field>
        <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
          <Field label="Firmware / driver version"><Input mono value={f.fw} onChange={v => set('fw', v)} placeholder={f.model && MM[f.model] ? (MM[f.model].series === 'MultiXpress' ? 'V5.10.03.24' : MM[f.model].series === 'ProXpress' ? 'V4.00.03.24' : 'V3.00.03.24') : 'V4.00.03.24'} ariaLabel="Firmware version" /></Field>
        </div>
        <Field label="Description"><Textarea value={f.desc} onChange={v => set('desc', v)} rows={5} placeholder="What happens, and what was expected?" ariaLabel="Description" /></Field>
        <Field label="Steps to reproduce"><Textarea value={f.steps} onChange={v => set('steps', v)} rows={4} placeholder="1. ..." ariaLabel="Steps to reproduce" /></Field>
        <Field label="Assignees"><MultiCombobox items={engItems} value={f.assignees} onValueChange={v => set('assignees', v)} placeholder="Type a name" ariaLabel="Assignees" /></Field>
        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold text-ink-4">Attachments</span>
          <span className="text-sm text-muted">Screenshots, videos and log files</span>
          <Attachments items={f.attachments} onRemove={i => set('attachments', f.attachments.filter((_, j) => j !== i))} />
          <div className="flex"><FileButton onFiles={list => set('attachments', [...f.attachments, ...list])}>Add files</FileButton></div>
        </div>
        {err ? <span className="border-l-[3px] border-danger-rule py-1 pl-3.5 text-danger" role="alert">{err}</span> : null}
      </div>
      <div className="flex justify-end gap-2.5 border-t border-line pt-6">
        <Button variant="secondary" onClick={() => router.push(back)}>Cancel</Button>
        <Button variant="primary" icon="check" onClick={save}>{mode === 'new' ? 'Report defect' : 'Save changes'}</Button>
      </div>
    </div>
  );
}
