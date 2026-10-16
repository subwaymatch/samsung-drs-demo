'use client';

import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { useMemo, useState } from 'react';
import { DST, RST, SEV, TM, USERS } from '@/lib/constants';
import { av } from '@/lib/people';
import { rModelId } from '@/lib/products';
import { lastAt } from '@/lib/records';
import type { Data, Option } from '@/lib/types';
import { Icon } from '../ui/icon';
import { Lead } from '../ui/lead';

interface Hit extends Option {
  /** Lower-case text to match: ids, titles, models, branches, names. */
  text: string;
  id: string;
  title: string;
  updated: string;
}
type Group = { value: string; items: Hit[] };

const PER_GROUP = 6;

/**
 * How well a hit matches the query: an exact or leading id first, then titles
 * that start with it, then whole words, then any other match. Zero means no match.
 */
function score(h: Hit, q: string) {
  const id = h.id.toLowerCase(), title = h.title.toLowerCase();
  if (id === q) return 100;
  if (id.startsWith(q) || id.replace(/^(d|cr)-/, '').startsWith(q)) return 80;
  if (title.startsWith(q)) return 60;
  if (new RegExp('(^|[^a-z0-9])' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(title)) return 50;
  if (title.includes(q)) return 40;
  return q.split(/\s+/).every(w => h.text.includes(w)) ? 20 : 0;
}

/**
 * Search across defects, code reviews and people (Ctrl+K). Results are grouped,
 * best matches first and then the most recently updated, and a review is found
 * by its branch or its model as well as its title.
 */
export function GlobalSearch({ data, onPick, shortcut }: { data: Data | undefined; onPick: (href: string) => void; shortcut: string[] }) {
  const [q, setQ] = useState('');
  const [k, setK] = useState(0);
  const groups = useMemo<Group[]>(() => {
    if (!data) return [];
    const defects: Hit[] = data.defects.map(d => ({
      value: '/defects/' + d.id, label: d.id + '  ' + d.title, sub: d.model + ', ' + DST[d.status].l, icon: SEV[d.sev].icon, color: SEV[d.sev].c,
      id: d.id, title: d.title, updated: lastAt(d), text: [d.id, d.title, d.model, d.comp].join(' ').toLowerCase()
    }));
    const reviews: Hit[] = data.reviews.map(r => {
      const m = rModelId(r, data.defects);
      return {
        value: '/reviews/' + r.id, label: r.id + '  ' + r.title, sub: r.type + ', ' + RST[r.status].l, icon: 'git-pull-request', color: RST[r.status].fg,
        id: r.id, title: r.title, updated: lastAt(r), text: [r.id, r.title, r.branch, m, r.linked, r.type].join(' ').toLowerCase()
      };
    });
    const people: Hit[] = USERS.map(u => ({
      value: '/teams/' + u.id, label: u.name + (u.en !== u.name ? ' (' + u.en + ')' : ''), sub: u.title + ', ' + TM[u.team].name, avatar: av(u.id),
      id: u.en, title: u.name + ' ' + u.en, updated: '', text: [u.name, u.en, u.title, TM[u.team].name].join(' ').toLowerCase()
    }));
    return [{ value: 'Defects', items: defects }, { value: 'Code reviews', items: reviews }, { value: 'People', items: people }];
  }, [data]);

  const results = useMemo<Group[]>(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) {
      // Before typing: what changed most recently.
      return groups.filter(g => g.value !== 'People').map(g => ({ ...g, items: [...g.items].sort((a, b) => (a.updated < b.updated ? 1 : -1)).slice(0, 4) }));
    }
    return groups
      .map(g => ({
        ...g,
        items: g.items
          .map(h => ({ h, s: score(h, ql) }))
          .filter(x => x.s > 0)
          .sort((a, b) => b.s - a.s || (a.h.updated < b.h.updated ? 1 : a.h.updated > b.h.updated ? -1 : 0))
          .slice(0, PER_GROUP)
          .map(x => x.h)
      }))
      .filter(g => g.items.length);
  }, [groups, q]);

  return (
    <BaseCombobox.Root<Hit>
      key={k}
      items={groups}
      filteredItems={results}
      autoHighlight
      value={null}
      onInputValueChange={v => setQ(v)}
      onValueChange={(v: Hit | null) => {
        if (!v) return;
        onPick(v.value);
        setQ('');
        setK(x => x + 1);
      }}
      itemToStringLabel={(h: Hit | null) => (h ? h.label : '')}
      isItemEqualToValue={(a: Hit, b: Hit) => !!a && !!b && a.value === b.value}
    >
      <BaseCombobox.InputGroup className="bui-cb" style={{ flexWrap: 'nowrap', paddingRight: 8 }}>
        <span className="flex text-[oklch(0.5_0.12_293)]"><Icon name="search" size={15} /></span>
        <BaseCombobox.Input className="bui-cb-input" placeholder="Search" id="gsearch" aria-label="Search defects, code reviews and people" style={{ minWidth: 0 }} />
        <span aria-hidden className="pointer-events-none flex flex-none gap-[3px]">
          {shortcut.map(s => <kbd key={s} className="kbd">{s}</kbd>)}
        </span>
      </BaseCombobox.InputGroup>
      <BaseCombobox.Portal>
        <BaseCombobox.Positioner className="bui-positioner" sideOffset={6}>
          <BaseCombobox.Popup className="bui-popup bui-search-popup">
            <BaseCombobox.Empty className="bui-empty">No defects, reviews or people match</BaseCombobox.Empty>
            <BaseCombobox.List>
              {(g: Group) => (
                <BaseCombobox.Group key={g.value} items={g.items} className="bui-sgroup">
                  <BaseCombobox.GroupLabel className="bui-sgroup-label">{q.trim() ? g.value : 'Recently updated ' + g.value.toLowerCase()}</BaseCombobox.GroupLabel>
                  <BaseCombobox.Collection>
                    {(it: Hit) => (
                      <BaseCombobox.Item key={it.value} value={it} className="bui-item">
                        <Lead it={it} />
                        <span className="bui-item-text">
                          <span className="bui-trunc">{it.label}</span>
                          {it.sub ? <span className="bui-item-sub bui-trunc">{it.sub}</span> : null}
                        </span>
                      </BaseCombobox.Item>
                    )}
                  </BaseCombobox.Collection>
                </BaseCombobox.Group>
              )}
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
}
