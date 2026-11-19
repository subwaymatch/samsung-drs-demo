import type { Option } from '@/lib/types';
import { Icon } from './icon';
import { Avatar } from './person';
import s from './lead.module.css';

/** Leading visual for an option: avatar, icon or color dot. */
export function Lead({ it, size = 15 }: { it?: Option | null; size?: number }) {
  if (!it) return null;
  if (it.avatar) return <Avatar person={it.avatar} size={24} />;
  if (it.icon) return <Icon name={it.icon} size={size} color={it.color} />;
  if (it.color) return <span className={s.dot} style={{ background: it.color }} />;
  return null;
}
