'use client';

import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DST, RST, SEV, TM, USERS } from '@/lib/constants';
import { buildNotifs, isUnread, readOf } from '@/lib/notifications';
import { av } from '@/lib/people';
import { isActiveReview, isOpen } from '@/lib/records';
import { useApp } from '@/lib/store';
import type { Option } from '@/lib/types';
import { Button } from '../ui/button';
import { Combobox } from '../ui/combobox';
import { Icon } from '../ui/icon';
import { Person } from '../ui/person';
import { DrsLogo, SamsungWordmark } from './logo';
import { DEFAULT_UI, ShellContext, type KeyRow, type Shell, type UiState } from './shell-context';

const NAV = [
  { href: '/', label: 'Insights', icon: 'bar-chart-3' },
  { href: '/defects', label: 'Defects', icon: 'bug' },
  { href: '/reviews', label: 'Code reviews', icon: 'git-pull-request' },
  { href: '/digests', label: 'Email digests', icon: 'mail' },
  { href: '/teams', label: 'Teams', icon: 'users' },
  { href: '/notifications', label: 'Notifications', icon: 'bell' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
  { href: '/about', label: 'About', icon: 'info' }
];
const isMac = () => typeof navigator !== 'undefined' && /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent || '');

function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 959px)');
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return narrow;
}

export function AppShell({ children }: { children: ReactNode }) {
  const app = useApp();
  const router = useRouter();
  const pathname = usePathname() || '/';
  const narrow = useNarrow();
  const [ui, setUiState] = useState<UiState>(DEFAULT_UI);
  const [toast, setToast] = useState('');
  const [kIdx, setKIdx] = useState(-1);
  const [sideOpen, setSideOpen] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [mainW, setMainW] = useState(0);
  const [modKey, setModKey] = useState('Ctrl');
  const rowsRef = useRef<{ rows: KeyRow[]; onEscape?: () => void }>({ rows: [] });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => setModKey(isMac() ? '⌘' : 'Ctrl'), []);

  // Reset per-page state on navigation.
  useEffect(() => {
    setKIdx(-1);
    setDrawer(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const el = mainRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setMainW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2800);
  }, []);
  const setUi = useCallback((patch: Partial<UiState> | ((u: UiState) => Partial<UiState>)) => {
    setUiState(u => ({ ...u, ...(typeof patch === 'function' ? patch(u) : patch) }));
  }, []);
  const registerRows = useCallback((rows: KeyRow[], onEscape?: () => void) => {
    rowsRef.current = { rows, onEscape };
  }, []);
  const focusSearch = useCallback(() => {
    const go = () => document.getElementById('gsearch')?.focus();
    if (window.matchMedia('(max-width: 959px)').matches) {
      setDrawer(true);
      setTimeout(go, 50);
    } else {
      setSideOpen(true);
      setTimeout(go, 50);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null, tag = t?.tagName || '';
      const typing = /INPUT|TEXTAREA|SELECT/.test(tag) || !!t?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && (e.key || '').toLowerCase() === 'k') {
        e.preventDefault();
        focusSearch();
        return;
      }
      if (typing) {
        if (e.key === 'Escape') t?.blur();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector('[data-open][role="listbox"], [data-open][role="menu"], [role="dialog"]')) return;
      const { rows, onEscape } = rowsRef.current, k = e.key;
      if (k === '/') {
        e.preventDefault();
        const el = document.getElementById('listsearch');
        if (el) el.focus();
        else focusSearch();
        return;
      }
      if (k === 'n' || k === 'N') {
        e.preventDefault();
        router.push(pathname.startsWith('/reviews') ? '/reviews/new' : '/defects/new');
        return;
      }
      if (k === '?') {
        router.push('/settings');
        return;
      }
      if ((k === 'j' || k === 'k') && rows.length) {
        e.preventDefault();
        setKIdx(i => (i < 0 ? (k === 'j' ? 0 : rows.length - 1) : Math.min(rows.length - 1, Math.max(0, i + (k === 'j' ? 1 : -1)))));
        return;
      }
      setKIdx(i => {
        const cur = rows[i];
        if ((k === 'Enter' || k === 'o') && cur) {
          e.preventDefault();
          setTimeout(cur.open);
        } else if ((k === 'x' || k === 'X') && cur && cur.toggle) {
          e.preventDefault();
          const tg = cur.toggle, v = !cur.checked;
          setTimeout(() => tg(v));
        } else if (k === 'Escape' && onEscape) setTimeout(onEscape);
        return i;
      });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [focusSearch, pathname, router]);

  // Keep the keyboard-highlighted row in view.
  useEffect(() => {
    if (kIdx < 0) return;
    const el = document.querySelector('[data-krow="' + kIdx + '"]');
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 80 || r.bottom > window.innerHeight - 40) window.scrollBy(0, r.top - window.innerHeight / 2);
  }, [kIdx]);

  const data = app?.data, prefs = app?.prefs;
  const meId = prefs?.meId || 'u1';
  const gItems = useMemo<Option[]>(() => {
    if (!data) return [];
    return [
      ...USERS.map(u => ({ value: '/teams/' + u.id, label: u.name + (u.en !== u.name ? ' (' + u.en + ')' : ''), sub: u.title + ', ' + TM[u.team].name, avatar: av(u.id) })),
      ...data.defects.map(d => ({ value: '/defects/' + d.id, label: d.id + '  ' + d.title, sub: d.model + ', ' + DST[d.status].l, icon: SEV[d.sev].icon, color: SEV[d.sev].c })),
      ...data.reviews.map(r => ({ value: '/reviews/' + r.id, label: r.id + '  ' + r.title, sub: r.type + ', ' + RST[r.status].l, icon: 'git-pull-request', color: RST[r.status].fg }))
    ];
  }, [data]);
  const unread = useMemo(() => {
    if (!data || !prefs) return 0;
    const rd = readOf(prefs.read, meId);
    return buildNotifs(data, meId, prefs.subs).filter(n => isUnread(n, rd)).length;
  }, [data, prefs, meId]);
  const counts: Record<string, number> = data
    ? { '/defects': data.defects.filter(isOpen).length, '/reviews': data.reviews.filter(isActiveReview).length, '/notifications': unread }
    : {};

  const active = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/'));
  const contentW = Math.min(1200, mainW - (narrow ? 40 : 96));
  const shell: Shell = { flash, ui, setUi, kIdx, setKIdx, registerRows, contentW, mainW, focusSearch };
  const me = av(meId);
  const topbar = narrow || !sideOpen;

  return (
    <ShellContext.Provider value={shell}>
      <div className={'flex min-h-screen bg-white ' + (topbar ? '[--topbar-h:56px]' : '[--topbar-h:0px] max-[959px]:[--topbar-h:56px]')}>
        {narrow && drawer ? <div className="fixed inset-0 z-[55] bg-[oklch(0.2_0.03_290/0.28)]" onClick={() => setDrawer(false)} /> : null}
        <aside
          className={
            'top-0 left-0 z-[60] h-screen w-[248px] flex-[0_0_248px] flex-col gap-6 overflow-y-auto border-r border-line bg-white px-4 pt-6 pb-5 ' +
            (narrow
              ? drawer ? 'fixed flex shadow-[0_0_40px_oklch(0.2_0.03_290/0.18)]' : 'hidden'
              : sideOpen ? 'sticky flex max-[959px]:hidden' : 'hidden')
          }
          aria-label="Main navigation"
        >
          <div className="flex items-center gap-3 px-2">
            <NextLink href="/" aria-label="Go to Insights" className="flex-none">
              <DrsLogo width={34} label="DRS" />
            </NextLink>
            <span aria-hidden className="h-7 w-px flex-none bg-[oklch(0.9_0.01_290)]" />
            <div className="flex min-w-0 flex-col gap-1">
              <SamsungWordmark width={64} />
              <span className="text-xs leading-none whitespace-nowrap text-muted">Printing Solutions</span>
            </div>
            <div className="ml-auto">
              <Button variant="ghost" size="sm" icon="panel-left-close" iconOnly title="Collapse sidebar" onClick={() => (narrow ? setDrawer(false) : setSideOpen(false))} />
            </div>
          </div>
          <Combobox
            items={gItems}
            value={null}
            onValueChange={v => {
              if (!v) return;
              document.getElementById('gsearch')?.blur();
              router.push(v);
            }}
            placeholder="Search"
            shortcut={[modKey, 'K']}
            leadIcon="search"
            inputId="gsearch"
            limit={30}
            resetOnSelect
            emptyText="No defects, reviews or people match"
            ariaLabel="Search defects, code reviews and people"
          />
          <nav className="flex flex-col gap-1">
            {NAV.map(n => (
              <NextLink key={n.href} href={n.href} className={'bui-btn ' + (active(n.href) ? 'bui-navActive' : 'bui-nav')} aria-current={active(n.href) ? 'page' : undefined}>
                <Icon name={n.icon} size={16} />
                <span className="flex-1 text-left">{n.label}</span>
                {n.href === '/notifications' && counts[n.href] ? (
                  <span className="grid h-5 min-w-5 place-items-center rounded-[10px] bg-accent-soft px-1.5 text-xs font-semibold text-accent-ink tabular-nums">{counts[n.href]}</span>
                ) : null}
              </NextLink>
            ))}
          </nav>
          <div className="flex-1" />
          <div className="flex min-w-0 items-center gap-2.5 border-t border-line px-1 pt-4">
            {app ? (
              <>
                <Person person={me} size={32} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="bui-trunc font-semibold">{me.name}</span>
                  <span className="bui-trunc text-[13px] text-muted">{me.title}</span>
                </div>
                <Button variant="ghost" size="sm" icon="log-out" iconOnly title="Sign out" onClick={() => { router.push('/settings'); flash('Sign-out is disabled in this demo. Switch users here instead.'); }} />
              </>
            ) : (
              <div className="h-8" />
            )}
          </div>
        </aside>

        <main ref={mainRef} className="min-w-0 flex-[1_1_auto]">
          <div className={'sticky top-0 z-40 h-14 items-center gap-3 border-b border-line bg-white px-4 ' + (topbar ? 'flex' : 'hidden max-[959px]:flex')}>
            <Button variant="ghost" icon={narrow ? 'menu' : 'panel-left-open'} iconOnly title="Open sidebar" onClick={() => (narrow ? setDrawer(true) : setSideOpen(true))} />
            <NextLink href="/" aria-label="Go to Insights">
              <DrsLogo width={26} />
            </NextLink>
            <div className="ml-auto">
              <Button variant="ghost" icon="search" iconOnly title="Search everything" onClick={focusSearch} />
            </div>
          </div>
          <div className="px-5 pt-6 pb-20 min-[960px]:px-12 min-[960px]:pt-9 min-[960px]:pb-24">{children}</div>
        </main>

        {toast ? (
          <div role="status" className="fixed bottom-7 left-1/2 z-[70] max-w-[calc(100vw-32px)] -translate-x-1/2 rounded bg-[oklch(0.25_0.03_293)] px-[18px] py-3 text-white shadow-[0_8px_24px_oklch(0.2_0.05_290/0.25)]">
            {toast}
          </div>
        ) : null}
      </div>
    </ShellContext.Provider>
  );
}
