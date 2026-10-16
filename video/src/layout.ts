// Element positions measured by scripts/capture.mjs, in CSS pixels and page
// coordinates of a 1600x900 viewport.
import data from './layout.json';

export const L = data;

/** Path of a capture in public/captures. */
export const cap = (name: string) => `captures/${name}.png`;
