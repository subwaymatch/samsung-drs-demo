'use client';

import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { useState } from 'react';
import type { Option } from '@/lib/types';
import { Icon } from './icon';
import { Lead } from './lead';

interface Common {
  items: Option[];
  placeholder?: string;
  emptyText?: string;
  limit?: number;
  ariaLabel?: string;
  /** Form validation: marks the input invalid and points to its error message. */
  invalid?: boolean;
  describedBy?: string;
  required?: boolean;
}
const formAria = (c: Pick<Common, 'invalid' | 'describedBy' | 'required'>) => ({
  'aria-invalid': c.invalid || undefined,
  'aria-describedby': c.describedBy,
  'aria-required': c.required || undefined
});

const label = (i: Option | null) => (i ? i.label : '');
const same = (a: Option, b: Option) => !!a && !!b && a.value === b.value;

function Popup({ emptyText }: { emptyText: string }) {
  return (
    <BaseCombobox.Portal>
      <BaseCombobox.Positioner className="bui-positioner" sideOffset={6}>
        <BaseCombobox.Popup className="bui-popup">
          <BaseCombobox.Empty className="bui-empty">{emptyText}</BaseCombobox.Empty>
          <BaseCombobox.List>
            {(it: Option) => (
              <BaseCombobox.Item key={it.value} value={it} className="bui-item">
                <Lead it={it} />
                <span className="bui-item-text">
                  <span className="bui-trunc">{it.label}</span>
                  {it.sub ? <span className="bui-item-sub bui-trunc">{it.sub}</span> : null}
                </span>
                <BaseCombobox.ItemIndicator className="bui-item-ind">
                  <Icon name="check" size={14} />
                </BaseCombobox.ItemIndicator>
              </BaseCombobox.Item>
            )}
          </BaseCombobox.List>
        </BaseCombobox.Popup>
      </BaseCombobox.Positioner>
    </BaseCombobox.Portal>
  );
}

/**
 * Filterable single select. With resetOnSelect it acts as a picker: it reports
 * the choice and clears itself, e.g. "Add assignee".
 */
export function Combobox({ items, value, onValueChange, placeholder, emptyText = 'No matches', limit, ariaLabel, resetOnSelect, dashed, leadIcon, inputId, shortcut, invalid, describedBy, required }: Common & {
  value: string | null;
  onValueChange: (v: string | null) => void;
  resetOnSelect?: boolean;
  dashed?: boolean;
  leadIcon?: string;
  inputId?: string;
  shortcut?: string[];
}) {
  const [k, setK] = useState(0);
  const vObj = items.find(i => i.value === value) || null;
  return (
    <BaseCombobox.Root<Option>
      key={k}
      items={items}
      limit={limit}
      value={vObj}
      onValueChange={(v: Option | null) => {
        onValueChange(v ? v.value : null);
        if (resetOnSelect) setK(x => x + 1);
      }}
      itemToStringLabel={label}
      isItemEqualToValue={same}
    >
      <BaseCombobox.InputGroup className={'bui-cb' + (dashed ? ' bui-cb-dashed' : '')} style={shortcut ? { flexWrap: 'nowrap', paddingRight: 8 } : undefined}>
        {leadIcon ? (
          <span className="flex text-[oklch(0.5_0.12_293)]">
            <Icon name={leadIcon} size={15} />
          </span>
        ) : vObj ? (
          <Lead it={vObj} />
        ) : null}
        <BaseCombobox.Input className="bui-cb-input" placeholder={placeholder} id={inputId} aria-label={ariaLabel || placeholder} style={shortcut ? { minWidth: 0 } : undefined} {...formAria({ invalid, describedBy, required })} />
        {shortcut ? (
          <span aria-hidden className="pointer-events-none flex flex-none gap-[3px]">
            {shortcut.map(s => <kbd key={s} className="kbd">{s}</kbd>)}
          </span>
        ) : (
          <BaseCombobox.Trigger className="bui-cb-btn" aria-label="Open">
            <Icon name="chevrons-up-down" size={14} />
          </BaseCombobox.Trigger>
        )}
      </BaseCombobox.InputGroup>
      <Popup emptyText={emptyText} />
    </BaseCombobox.Root>
  );
}

/** Filterable multi-select with removable chips. */
export function MultiCombobox({ items, value, onValueChange, placeholder, emptyText = 'No matches', limit, ariaLabel, invalid, describedBy, required, inputId }: Common & {
  inputId?: string;
  value: string[];
  onValueChange: (v: string[]) => void;
}) {
  const vObj = items.filter(i => (value || []).includes(i.value));
  return (
    <BaseCombobox.Root<Option, true>
      multiple
      items={items}
      limit={limit}
      value={vObj}
      onValueChange={(v: Option[] | null) => onValueChange((v || []).map(x => x.value))}
      itemToStringLabel={label}
      isItemEqualToValue={same}
    >
      <BaseCombobox.InputGroup className="bui-cb">
        <BaseCombobox.Chips className="bui-chips">
          <BaseCombobox.Value>
            {(vals: Option[]) =>
              vals.map(v => (
                <BaseCombobox.Chip key={v.value} className="bui-chip" aria-label={v.label}>
                  <Lead it={v} size={14} />
                  <span className="bui-trunc">{v.label}</span>
                  <BaseCombobox.ChipRemove className="bui-chip-x" aria-label={'Remove ' + v.label}>
                    <Icon name="x" size={12} />
                  </BaseCombobox.ChipRemove>
                </BaseCombobox.Chip>
              ))
            }
          </BaseCombobox.Value>
          <BaseCombobox.Input className="bui-cb-input" placeholder={vObj.length ? '' : placeholder} id={inputId} aria-label={ariaLabel || placeholder} {...formAria({ invalid, describedBy, required })} />
        </BaseCombobox.Chips>
      </BaseCombobox.InputGroup>
      <Popup emptyText={emptyText} />
    </BaseCombobox.Root>
  );
}
