'use client';

import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { Switch as BaseSwitch } from '@base-ui/react/switch';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import type { Option } from '@/lib/types';
import { Icon } from './icon';

/** A single-choice segmented control. */
export function Segmented({ value, onValueChange, items, ariaLabel }: { value: string; onValueChange: (v: string) => void; items: Option[]; ariaLabel?: string }) {
  return (
    <ToggleGroup
      className="bui-seg"
      aria-label={ariaLabel}
      value={[value]}
      onValueChange={v => { if (v && v.length) onValueChange(String(v[v.length - 1])); }}
    >
      {items.map(it => (
        <Toggle key={it.value} value={it.value} className="bui-seg-item">
          {it.icon ? <Icon name={it.icon} size={14} color={it.color} /> : null}
          {it.label}
          {it.count !== undefined && it.count !== '' ? <span className="bui-seg-count">{it.count}</span> : null}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}

export function Switch({ checked, onCheckedChange, label, sub }: { checked: boolean; onCheckedChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <label className="bui-label items-center">
      <BaseSwitch.Root className="bui-switch" checked={!!checked} onCheckedChange={v => onCheckedChange(!!v)}>
        <BaseSwitch.Thumb className="bui-switch-thumb" />
      </BaseSwitch.Root>
      <span>
        <span className="font-[550]">{label}</span>
        {sub ? <span className="bui-label-sub">{sub}</span> : null}
      </span>
    </label>
  );
}

export function Checkbox({ checked, onCheckedChange, label, ariaLabel }: { checked: boolean; onCheckedChange: (v: boolean) => void; label?: string; ariaLabel?: string }) {
  const box = (
    <BaseCheckbox.Root className="bui-check mt-px" checked={!!checked} onCheckedChange={v => onCheckedChange(!!v)} aria-label={label ? undefined : ariaLabel}>
      <BaseCheckbox.Indicator className="flex">
        <Icon name="check" size={13} strokeWidth={2.5} />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
  if (!label) return box;
  return (
    <label className="bui-label">
      {box}
      <span>{label}</span>
    </label>
  );
}
