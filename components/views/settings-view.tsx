'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { TM, UM } from '@/lib/constants';
import { userOptions } from '@/lib/people';
import { resetDemo, setPrefs, useApp } from '@/lib/store';
import { DIFF_MODES } from '../common/diff';
import { Loading, PageHeader } from '../common/basics';
import { useShell } from '../shell/shell-context';
import { Button } from '../ui/button';
import { Combobox } from '../ui/combobox';
import { Segmented } from '../ui/toggles';

const Row = ({ title, sub, children }: { title: string; sub: string; children: ReactNode }) => (
  <div className="flex flex-wrap gap-x-10 gap-y-3 border-t border-line py-6">
    <div className="flex max-w-[320px] flex-[1_1_240px] flex-col gap-1"><span className="font-semibold">{title}</span><span className="text-sm leading-normal text-pretty text-muted">{sub}</span></div>
    <div className="flex min-w-0 flex-[1_1_320px]">{children}</div>
  </div>
);

export function SettingsView() {
  const app = useApp();
  const router = useRouter();
  const { flash } = useShell();
  const [mod, setMod] = useState('Ctrl');
  useEffect(() => setMod(/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent) ? '⌘' : 'Ctrl'), []);
  const users = useMemo(() => userOptions(), []);
  if (!app) return <Loading />;
  const me = UM[app.prefs.meId];
  const keys: [string[], string][] = [[[mod, 'K'], 'Search everything'], [['/'], 'Filter the list'], [['N'], 'New defect or review'], [['J', 'K'], 'Move down / up'], [['Enter'], 'Open'], [['X'], 'Select defect'], [['?'], 'Open settings']];

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-10">
      <PageHeader title="Settings" sub="Preferences are saved in this browser." />
      <section className="flex flex-col">
        <h3 className="mb-2 text-base font-[650]">Preferences</h3>
        <Row title="Code review diffs" sub="How file changes appear in code reviews.">
          <div className="overflow-x-auto"><Segmented ariaLabel="Diff layout" items={DIFF_MODES} value={app.prefs.diff} onValueChange={v => setPrefs({ diff: v as 'sbs' | 'uni' })} /></div>
        </Row>
        <Row title="Keyboard shortcuts" sub="Available on every page except while typing in a field.">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2.5 text-ink-3">
            {keys.map(([ks, label]) => (
              <span key={label} className="contents">
                <span className="flex gap-1">{ks.map(k => <kbd key={k} className="kbd h-[22px] min-w-[22px] text-[13px]">{k}</kbd>)}</span>
                <span>{label}</span>
              </span>
            ))}
          </div>
        </Row>
      </section>
      <section className="flex flex-col">
        <h3 className="mb-2 text-base font-[650]">Demo</h3>
        <Row title="Signed in as" sub="Switch users to see each role's permissions. Code Review Team members can assign reviewers and approve changes.">
          <div className="flex w-full max-w-[420px] flex-col gap-2.5">
            <Combobox items={users} value={app.prefs.meId} onValueChange={v => { if (v) { setPrefs({ meId: v }); flash('Signed in as ' + UM[v].name); } }} placeholder="Switch user" ariaLabel="Signed in as" />
            <span className="text-sm text-ink-5">{me.title} · {TM[me.team].name}</span>
          </div>
        </Row>
        <Row title="Reset demo data" sub="Restores the original defects and code reviews. Your edits are discarded.">
          <div className="flex items-start">
            <Button variant="secondary" icon="refresh-cw" onClick={() => { resetDemo(); router.push('/'); flash('Demo data reset'); }}>Reset demo data</Button>
          </div>
        </Row>
      </section>
    </div>
  );
}
