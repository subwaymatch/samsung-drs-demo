/**
 * Isometric illustrations of the printing division's world, generated with GPT Image 2.6 at `quality: "low"` on a
 * transparent background (see "Generated images" in the README), their violet accents then turned into warm greys.
 * Trimmed to the drawing and at most 512px on the long side, at public/illustrations/<name>.webp.
 */
export interface Illustration {
  name: string;
  width: number;
  height: number;
  /** What it shows, for alt text. */
  subject: string;
}

const LIST: [string, number, number, string][] = [
  ['bell', 359, 512, 'a notification bell'],
  ['board', 512, 359, "a printer's circuit board"],
  ['box', 481, 512, 'a taped shipping box'],
  ['calendar', 495, 512, 'a desk calendar'],
  ['chair', 324, 512, 'an office chair'],
  ['clipboard', 312, 512, 'a QA checklist on a clipboard'],
  ['comments', 447, 512, 'two comment bubbles'],
  ['dashboard', 381, 512, 'a monitor showing charts'],
  ['desk', 483, 512, "a developer's desk with a code diff on screen"],
  ['envelope', 491, 512, 'an envelope with a notification dot'],
  ['gears', 512, 450, 'two interlocking gears'],
  ['globe', 347, 512, 'a desk globe pinned at Korea and India'],
  ['headphones', 400, 512, 'over-ear headphones'],
  ['hourglass', 300, 512, 'an hourglass'],
  ['jam', 512, 505, 'a printer with a page jammed in its rollers'],
  ['keycaps', 512, 419, 'two keyboard keycaps'],
  ['keycard', 326, 512, 'an office door with a keycard reader'],
  ['lanyard', 152, 512, 'an ID card on a lanyard'],
  ['laptop', 439, 512, 'a laptop showing code'],
  ['meeting', 458, 512, 'a meeting table facing a wall screen'],
  ['mug', 359, 512, 'a coffee mug'],
  ['notes', 512, 428, 'a pad of sticky notes'],
  ['padlock', 413, 512, 'an open padlock and its key'],
  ['paper', 512, 395, 'a ream of printer paper'],
  ['phone', 259, 512, 'a smartphone showing a notification'],
  ['pie', 512, 435, 'a pie chart with one slice pulled out'],
  ['printer', 462, 512, 'an office multifunction printer printing a page'],
  ['rack', 310, 512, 'a server rack'],
  ['scanner', 442, 512, 'a flatbed scanner with its lid raised'],
  ['stapler', 512, 468, 'an office stapler'],
  ['test-page', 512, 400, 'a magnifying glass over a streak on a printed test page'],
  ['toner', 512, 400, 'a laser toner cartridge'],
  ['toolbox', 412, 512, 'an open toolbox with a screwdriver and a wrench'],
  ['truck', 512, 503, 'a delivery truck'],
  ['warning', 487, 512, 'a warning sign'],
];

export const ILLUSTRATIONS: Illustration[] = LIST.map(([name, width, height, subject]) => ({
  name,
  width,
  height,
  subject
}));

export const ILLUSTRATION: Record<string, Illustration> = Object.fromEntries(ILLUSTRATIONS.map(i => [i.name, i]));

/** The file for an illustration. */
export const illustrationSrc = (name: string) => '/illustrations/' + name + '.webp';
