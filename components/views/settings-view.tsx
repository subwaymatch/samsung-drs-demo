import { useNavigate } from 'react-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { TM, UM } from '@/lib/constants';
import { userOptions } from '@/lib/people';
import { resetDemo, setPrefs, useApp } from '@/lib/store';
import { cx } from '@/lib/cx';
import { DIFF_MODES } from '../common/diff';
import { Loading, PageHeader } from '../common/basics';
import { useShell } from '../shell/shell-context';
import { Button } from '../ui/button';
import { Combobox } from '../ui/combobox';
import { Segmented } from '../ui/toggles';
import s from './settings-view.module.css';

const Row = ({ title, sub, children }: { title: string; sub: string; children: ReactNode }) => (
  <div className={s.row}>
    <div className={s.rowLabel}><span className={s.rowTitle}>{title}</span><span className={s.rowSub}>{sub}</span></div>
    <div className={s.rowControl}>{children}</div>
  </div>
);

export function SettingsView() {
  const app = useApp();
  const navigate = useNavigate();
  const { flash } = useShell();
  const [mod, setMod] = useState('Ctrl');
  useEffect(() => setMod(/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent) ? '⌘' : 'Ctrl'), []);
  const users = useMemo(() => userOptions(), []);
  if (!app) return <Loading />;
  const me = UM[app.prefs.meId];
  const keys: [string[], string][] = [[[mod, 'K'], 'Search everything'], [['/'], 'Filter the list'], [['N'], 'New defect or review'], [['J', 'K'], 'Move down / up'], [['Enter'], 'Open'], [['X'], 'Select defect'], [['?'], 'Open settings']];

  return (
    <div className={s.page}>
      <PageHeader title="Settings" />
      <section className={s.group}>
        <h2 className={s.groupTitle}>Preferences</h2>
        <Row title="Code review diffs" sub="How file changes appear in code reviews">
          <div className={s.diffMode}><Segmented ariaLabel="Diff layout" items={DIFF_MODES} value={app.prefs.diff} onValueChange={v => setPrefs({ diff: v as 'sbs' | 'uni' })} /></div>
        </Row>
        <Row title="Keyboard shortcuts" sub="Available on every page except while typing in a field">
          <div className={s.shortcuts}>
            {keys.map(([ks, label]) => (
              <span key={label} className={s.shortcut}>
                <span className={s.keys}>{ks.map(k => <kbd key={k} className={cx('kbd', s.key)}>{k}</kbd>)}</span>
                <span>{label}</span>
              </span>
            ))}
          </div>
        </Row>
      </section>
      <section className={s.group}>
        <h2 className={s.groupTitle}>Demo</h2>
        <Row title="Signed in as" sub="Switch users to see each role's permissions. Code Review Team members can assign reviewers and approve changes.">
          <div className={s.account}>
            <Combobox items={users} value={app.prefs.meId} onValueChange={v => { if (v) { setPrefs({ meId: v }); flash('Signed in as ' + UM[v].name); } }} placeholder="Switch user" ariaLabel="Signed in as" />
            <span className={s.accountMeta}>{me.title}, {TM[me.team].name}</span>
          </div>
        </Row>
        <Row title="Reset demo data" sub="Restores the original defects and code reviews. Your edits are discarded.">
          <div className={s.reset}>
            <Button variant="secondary" icon="refresh-cw" onClick={() => { resetDemo(); navigate('/'); flash('Demo data reset'); }}>Reset demo data</Button>
          </div>
        </Row>
      </section>
    </div>
  );
}
