/** Joins class names, skipping empty and false values: cx(s.row, active && s.rowActive, className). */
export const cx = (...names: (string | false | null | undefined)[]) => names.filter(Boolean).join(' ');
