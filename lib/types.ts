export type Role = 'qa' | 'eng' | 'cr';
export type Severity = 'critical' | 'major' | 'minor' | 'trivial';
export type DefectStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type ReviewStatus = 'pending' | 'in_review' | 'changes' | 'approved' | 'denied' | 'withdrawn';
export type Decision = 'approved' | 'changes' | 'denied';
export type MigState = 'jira' | 'mirrored' | 'legacy';

export interface Team {
  k: string;
  name: string;
  desc: string;
}

export interface User {
  id: string;
  name: string;
  en: string;
  title: string;
  role: Role;
  team: string;
  /** Avatar hue. */
  h: number;
  intro: string;
  email: string;
  /** Portrait URL, or empty while the person has none. */
  photo: string;
  site: string;
}

export interface Model {
  id: string;
  series: 'Xpress' | 'ProXpress' | 'MultiXpress';
  kind: string;
  /** Launch quarter, e.g. "2017-Q2". */
  launch: string;
}

export interface Attachment {
  name: string;
  size: number;
  type: string;
  url?: string;
  temp?: boolean;
}

/** One activity entry. t: e = event, c = comment, d = review decision. */
export interface Activity {
  t: 'e' | 'c' | 'd';
  u: string;
  at: string;
  x: string;
  dec?: Decision | null;
  att: Attachment[];
  loc?: string;
}

export interface Affects {
  lines: string[];
  models: string[];
}

export interface P4Fix {
  cl: string;
  u: string;
  at: string;
  desc: string;
}

/** How a resolved or closed defect was resolved. */
export type Resolution = 'fixed' | 'duplicate' | 'cannot_reproduce' | 'as_designed';

export interface Defect {
  id: string;
  title: string;
  model: string;
  comp: string;
  sev: Severity;
  status: DefectStatus;
  fw: string;
  reporter: string;
  assignees: string[];
  created: string;
  desc: string;
  steps: string;
  attachments: Attachment[];
  activity: Activity[];
  affects?: Affects;
  related?: string[];
  p4?: P4Fix[];
  /** Set once the defect is resolved or closed. */
  resolution?: Resolution;
}

export interface Reviewer {
  u: string;
  dec: Decision | null;
}

export interface FileDiff {
  path: string;
  lines: string[];
  add: number;
  del: number;
}

export interface LineComment {
  f: number;
  key: string;
  no: number;
  u: string;
  at: string;
  x: string;
}

export interface Withdrawal {
  at: string;
  by: string;
  reason: string;
}

export interface Review {
  id: string;
  title: string;
  type: string;
  branch: string;
  cl?: string;
  author: string;
  reviewers: Reviewer[];
  status: ReviewStatus;
  linked: string;
  submitted: string;
  desc: string;
  files: FileDiff[];
  attachments: Attachment[];
  activity: Activity[];
  lineComments?: LineComment[];
  withdrawn?: Withdrawal;
  affects?: Affects;
  related?: string[];
}

export interface Data {
  defects: Defect[];
  reviews: Review[];
}

/** A person as rendered in avatars, preview cards and lists. */
export interface PersonView {
  id: string;
  name: string;
  en: string;
  href: string;
  title: string;
  email: string;
  teamName: string;
  ini: string;
  bg: string;
  fg: string;
  /** Portrait URL, or empty to show initials. */
  photo: string;
}

/** An option for Select, Combobox and Segmented controls. */
export interface Option {
  value: string;
  label: string;
  sub?: string;
  icon?: string;
  color?: string | null;
  count?: number | string;
  avatar?: PersonView;
  en?: string;
}
