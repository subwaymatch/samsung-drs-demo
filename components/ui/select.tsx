'use client';

import { Select as BaseSelect } from '@base-ui/react/select';
import type { Option } from '@/lib/types';
import { Icon } from './icon';
import { Lead } from './lead';

export function Select({ value, onValueChange, items, placeholder = 'Select…', ariaLabel }: {
  value: string | null;
  onValueChange: (v: string) => void;
  items: Option[];
  placeholder?: string;
  ariaLabel?: string;
}) {
  const sel = items.find(i => i.value === value);
  return (
    <BaseSelect.Root
      value={value ?? null}
      onValueChange={v => { if (v != null) onValueChange(String(v)); }}
      items={items.map(i => ({ value: i.value, label: i.label }))}
    >
      <BaseSelect.Trigger className="bui-trigger" aria-label={ariaLabel}>
        <span className="bui-trigger-val">
          {sel ? (
            <>
              <Lead it={sel} />
              <span className="bui-trunc">{sel.label}</span>
            </>
          ) : (
            <span className="bui-ph">{placeholder}</span>
          )}
        </span>
        <BaseSelect.Icon className="bui-chev">
          <Icon name="chevrons-up-down" size={14} />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner className="bui-positioner" sideOffset={6} alignItemWithTrigger={false}>
          <BaseSelect.Popup className="bui-popup">
            {items.map(it => (
              <BaseSelect.Item key={it.value} value={it.value} className="bui-item">
                <Lead it={it} />
                <span className="bui-item-text">
                  <BaseSelect.ItemText>{it.label}</BaseSelect.ItemText>
                  {it.sub ? <span className="bui-item-sub">{it.sub}</span> : null}
                </span>
                {it.count !== undefined && it.count !== '' ? <span className="bui-seg-count ml-3">{it.count}</span> : null}
                <BaseSelect.ItemIndicator className="bui-item-ind">
                  <Icon name="check" size={14} />
                </BaseSelect.ItemIndicator>
              </BaseSelect.Item>
            ))}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
