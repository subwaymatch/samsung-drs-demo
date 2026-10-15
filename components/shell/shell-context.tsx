'use client';

import { createContext, useContext, useEffect, useRef } from 'react';

export type SortState = { k: string; d: 1 | -1 };

/** UI state that should survive navigating between pages. */
export interface UiState {
  range: number;
  dScope: string;
  dStatus: string;
  rScope: string;
  rStatus: string;
  dSort: SortState;
  rSort: SortState;
  compOpen: boolean;
  nFilter: string;
  teamQ: string;
  teamF: string;
}
export const DEFAULT_UI: UiState = {
  range: 30, dScope: 'all', dStatus: 'all', rScope: 'all', rStatus: 'all',
  dSort: { k: 'updated', d: -1 }, rSort: { k: 'updated', d: -1 }, compOpen: false, nFilter: 'all', teamQ: '', teamF: 'all'
};

/** A row that keyboard shortcuts can move to, open and select. */
export interface KeyRow {
  open: () => void;
  toggle?: (v: boolean) => void;
  checked?: boolean;
}

export interface Shell {
  flash: (msg: string) => void;
  ui: UiState;
  setUi: (patch: Partial<UiState> | ((u: UiState) => Partial<UiState>)) => void;
  kIdx: number;
  setKIdx: (i: number) => void;
  registerRows: (rows: KeyRow[], onEscape?: () => void) => void;
  /** Width of the main content column, for choosing compact table layouts. */
  contentW: number;
  mainW: number;
  focusSearch: () => void;
}

export const ShellContext = createContext<Shell | null>(null);

export function useShell(): Shell {
  const s = useContext(ShellContext);
  if (!s) throw new Error('useShell must be used inside AppShell');
  return s;
}

/** Register the rows that J / K / Enter / X act on. */
export function useKeyRows(rows: KeyRow[], onEscape?: () => void) {
  const { registerRows } = useShell();
  const ref = useRef({ rows, onEscape });
  ref.current = { rows, onEscape };
  useEffect(() => {
    registerRows(ref.current.rows, ref.current.onEscape);
  });
  useEffect(() => () => registerRows([]), [registerRows]);
}
