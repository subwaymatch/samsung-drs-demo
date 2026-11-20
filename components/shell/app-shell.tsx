import { Link, useLocation, useNavigate } from 'react-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { buildNotifs, isUnread, readOf } from '@/lib/notifications';
import { av } from '@/lib/people';
import { isActiveReview, isOpen } from '@/lib/records';
import { useApp } from '@/lib/store';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import { Person } from '../ui/person';
import { GlobalSearch } from './global-search';
import { DrsLogo, SamsungWordmark } from './logo';
import { DEFAULT_UI, ShellContext, type KeyRow, type Shell, type UiState } from './shell-context';
import { cx } from '@/lib/cx';
import s from './app-shell.module.css';

const NAV = [
  { href: '/', label: 'Insights', icon: 'bar-chart-3' },
  { href: '/defects', label: 'Defects', icon: 'bug' },
  { href: '/reviews', label: 'Code Reviews', icon: 'git-pull-request' },
  { href: '/digests', label: 'Email Digests', icon: 'mail' },
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
  const navigate = useNavigate();
  const { pathname } = useLocation();
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
  // Focus the search box in the same keystroke, so nothing typed right after
  // Ctrl+K is lost; open the sidebar or drawer first when it is hidden.
  const focusSearch = useCallback(() => {
    const el = document.getElementById('gsearch');
    if (el && el.getClientRects().length) {
      el.focus();
      return;
    }
    flushSync(() => (window.matchMedia('(max-width: 959px)').matches ? setDrawer(true) : setSideOpen(true)));
    document.getElementById('gsearch')?.focus();
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
        navigate(pathname.startsWith('/reviews') ? '/reviews/new' : '/defects/new');
        return;
      }
      if (k === '?') {
        navigate('/settings');
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
  }, [focusSearch, navigate, pathname]);

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
      <div className={cx(s.shell, topbar && s.shellWithTopbar)}>
        {narrow && drawer ? <div className={s.scrim} onClick={() => setDrawer(false)} /> : null}
        <aside
          className={cx(s.sidebar, narrow ? (drawer ? s.sidebarDrawer : s.sidebarHidden) : sideOpen ? s.sidebarDocked : s.sidebarHidden)}
          aria-label="Main navigation"
        >
          <div className={s.brand}>
            {/* The mark and the wordmark are one link home */}
            <Link to="/" aria-label="DRS, Samsung Printing Solutions: go to Insights" className={cx('focus-ring', s.brandLink)}>
              <DrsLogo width={34} label="DRS" />
              <span className={s.brandText}>
                <SamsungWordmark width={64} />
                <span className={s.brandTagline}>Printing Solutions</span>
              </span>
            </Link>
            <div className={s.trailing}>
              <Button variant="ghost" size="sm" icon="panel-left-close" iconOnly title="Collapse sidebar" onClick={() => (narrow ? setDrawer(false) : setSideOpen(false))} />
            </div>
          </div>
          <GlobalSearch
            data={data}
            shortcut={[modKey, 'K']}
            onPick={href => {
              document.getElementById('gsearch')?.blur();
              navigate(href);
            }}
          />
          <nav className={s.nav}>
            {NAV.map(n => (
              <Link key={n.href} to={n.href} className={'bui-btn ' + (active(n.href) ? 'bui-navActive' : 'bui-nav')} aria-current={active(n.href) ? 'page' : undefined}>
                <Icon name={n.icon} size={16} />
                <span className={s.navLabel}>{n.label}</span>
                {n.href === '/notifications' && counts[n.href] ? (
                  // Center on the digits' cap height, not the font's line box. Proportional figures keep "1" from pushing "13" off-center.
                  <span className={cx(s.navCount, active(n.href) && s.navCountActive)}>{counts[n.href]}</span>
                ) : null}
              </Link>
            ))}
          </nav>
          <div className={s.spacer} />
          <div className={s.account}>
            {app ? (
              <>
                <Person person={me} size={32} />
                <div className={s.accountText}>
                  <span className={cx('bui-trunc', s.accountName)}>{me.name}</span>
                  <span className={cx('bui-trunc', s.accountTitle)}>{me.title}</span>
                </div>
                <Button variant="ghost" size="sm" icon="log-out" iconOnly title="Sign out" onClick={() => { navigate('/settings'); flash('Sign-out is disabled in this demo. Switch users here instead.'); }} />
              </>
            ) : (
              <div className={s.accountPlaceholder} />
            )}
          </div>
          <Link to="/about" className={s.disclaimer}>
            Portfolio demo with mock data. Not affiliated with Samsung Electronics.
          </Link>
        </aside>

        <main ref={mainRef} className={s.main}>
          <div className={cx(s.topbar, topbar && s.topbarShown)}>
            <Button variant="ghost" icon={narrow ? 'menu' : 'panel-left-open'} iconOnly title="Open sidebar" onClick={() => (narrow ? setDrawer(true) : setSideOpen(true))} />
            {/* The same brand as the sidebar, laid out in one line */}
            <Link to="/" aria-label="DRS, Samsung Printing Solutions: go to Insights" className={cx('focus-ring', s.brandLink, s.brandLinkRow)}>
              <DrsLogo width={26} />
              <SamsungWordmark width={56} />
              <span className={s.brandTagline}>Printing Solutions</span>
            </Link>
            <div className={s.trailing}>
              <Button variant="ghost" icon="search" iconOnly title="Search everything" onClick={focusSearch} />
            </div>
          </div>
          <div className={s.content}>{children}</div>
        </main>

        {toast ? (
          <div role="status" className={s.toast}>
            {toast}
          </div>
        ) : null}
      </div>
    </ShellContext.Provider>
  );
}
