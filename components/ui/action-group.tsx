'use client';

import { Button as BaseButton } from '@base-ui/react/button';
import { Menu } from '@base-ui/react/menu';
import { Icon } from './icon';

export type MenuAction =
  | { sep: true }
  | { sep?: false; icon: string; label: string; sub?: string; danger?: boolean; disabled?: boolean; onClick?: () => void };

/** "Edit" button joined to a menu of more actions. */
export function ActionGroup({ onPrimary, items, primaryLabel = 'Edit', primaryIcon = 'pencil' }: { onPrimary: () => void; items: MenuAction[]; primaryLabel?: string; primaryIcon?: string }) {
  return (
    <div className="bui-group">
      <BaseButton className="bui-btn bui-secondary bui-g-l" onClick={onPrimary}>
        <Icon name={primaryIcon} size={16} />
        {primaryLabel}
      </BaseButton>
      <Menu.Root>
        <Menu.Trigger className="bui-btn bui-secondary bui-g-r" aria-label="More actions">
          <Icon name="chevron-down" size={16} />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="bui-positioner" sideOffset={6} align="end">
            <Menu.Popup className="bui-popup" style={{ minWidth: 240 }}>
              {items.map((it, i) =>
                it.sep ? (
                  <div key={i} className="bui-menu-sep" role="separator" />
                ) : (
                  <Menu.Item key={i} className={'bui-item' + (it.danger ? ' bui-menu-danger' : '')} disabled={!!it.disabled} onClick={it.onClick}>
                    <Icon name={it.icon} size={16} color={it.danger ? 'var(--color-danger)' : undefined} />
                    <span className="bui-item-text">
                      <span>{it.label}</span>
                      {it.sub ? <span className="bui-item-sub">{it.sub}</span> : null}
                    </span>
                  </Menu.Item>
                )
              )}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}
