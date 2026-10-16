'use client';

import { Input as BaseInput } from '@base-ui/react/input';
import { useRef, useState, type KeyboardEvent } from 'react';
import type { Option } from '@/lib/types';
import { Icon } from './icon';
import { Lead } from './lead';

/** Form validation state passed to an input. */
export interface FieldAria {
  invalid?: boolean;
  describedBy?: string;
  required?: boolean;
}
const formAria = (c: FieldAria) => ({ 'aria-invalid': c.invalid || undefined, 'aria-describedby': c.describedBy, 'aria-required': c.required || undefined });

export function Input({ value, onChange, placeholder, icon, mono, id, autoFocus, ariaLabel, invalid, describedBy, required }: FieldAria & {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: string;
  mono?: boolean;
  id?: string;
  autoFocus?: boolean;
  ariaLabel?: string;
}) {
  const el = (
    <BaseInput
      id={id}
      autoFocus={autoFocus}
      aria-label={ariaLabel}
      {...formAria({ invalid, describedBy, required })}
      className={'bui-input' + (mono ? ' bui-mono' : '') + (icon ? ' bui-with-icon' : '')}
      value={value ?? ''}
      placeholder={placeholder}
      onValueChange={v => onChange(String(v ?? ''))}
    />
  );
  if (!icon) return el;
  return (
    <div className="relative w-full">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint">
        <Icon name={icon} size={15} />
      </span>
      {el}
    </div>
  );
}

export function Textarea({ value, onChange, placeholder, rows = 4, ariaLabel, id, invalid, describedBy, required }: FieldAria & { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; ariaLabel?: string; id?: string }) {
  return (
    <textarea
      id={id}
      rows={rows}
      aria-label={ariaLabel}
      {...formAria({ invalid, describedBy, required })}
      className="bui-input bui-textarea"
      value={value ?? ''}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
    />
  );
}

/** Textarea with an @mention picker for people. */
export function MentionTextarea({ value, onChange, people, rows = 3, placeholder, ariaLabel }: {
  value: string;
  onChange: (v: string) => void;
  people: Option[];
  rows?: number;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [m, setM] = useState<{ start: number; q: string } | null>(null);
  const [hi, setHi] = useState(0);
  const v = value ?? '';
  const detect = (text: string, pos: number) => {
    const mm = /(^|\s)@([^\s@]{0,20})$/.exec(text.slice(0, pos));
    if (mm) {
      setM({ start: pos - mm[2].length - 1, q: mm[2].toLowerCase() });
      setHi(0);
    } else setM(null);
  };
  const list = m ? people.filter(p => (p.label + ' ' + (p.en || '')).toLowerCase().includes(m.q)).slice(0, 6) : [];
  const pick = (p: Option) => {
    if (!m) return;
    const el = ref.current, pos = el ? el.selectionStart : v.length, start = m.start;
    onChange(v.slice(0, start) + '@' + p.label + ' ' + v.slice(pos));
    setM(null);
    requestAnimationFrame(() => {
      if (!el) return;
      const c = start + p.label.length + 2;
      el.focus();
      el.setSelectionRange(c, c);
    });
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!list.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi(i => (i + 1) % list.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(i => (i - 1 + list.length) % list.length); }
    else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pick(list[hi]); }
    else if (e.key === 'Escape') { e.stopPropagation(); setM(null); }
  };
  return (
    <div className="relative">
      <textarea
        ref={ref}
        rows={rows}
        aria-label={ariaLabel}
        className="bui-input bui-textarea"
        value={v}
        placeholder={placeholder}
        onChange={e => { onChange(e.target.value); detect(e.target.value, e.target.selectionStart); }}
        onKeyDown={onKey}
        onBlur={() => setTimeout(() => setM(null), 150)}
      />
      {list.length ? (
        <div className="bui-popup absolute top-full left-0 z-[100] mt-1.5 w-[300px] min-w-0" role="listbox" style={{ maxWidth: '100%' }}>
          {list.map((p, i) => (
            <div
              key={p.value}
              role="option"
              aria-selected={i === hi}
              className="bui-item"
              data-highlighted={i === hi ? '' : undefined}
              onMouseDown={e => { e.preventDefault(); pick(p); }}
              onMouseEnter={() => setHi(i)}
            >
              <Lead it={p} />
              <span className="bui-item-text">
                <span className="bui-trunc">{p.label}</span>
                {p.sub ? <span className="bui-item-sub bui-trunc">{p.sub}</span> : null}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
