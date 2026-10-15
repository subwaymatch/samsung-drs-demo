// "Clone with changes" hands a prefilled form to the next new-defect or
// new-review page. Kept in memory: it only needs to survive one client-side
// navigation.

export interface DefectDraft {
  kind: 'defect';
  cloneOf: string;
  title: string;
  aff: string[];
  model: string | null;
  comp: string | null;
  sev: string;
  status: string;
  fw: string;
  desc: string;
  steps: string;
  assignees: string[];
}
export interface ReviewDraft {
  kind: 'review';
  cloneOf: string;
  title: string;
  type: string;
  branch: string;
  linked: string | null;
  desc: string;
}

let draft: DefectDraft | ReviewDraft | null = null;
export const setDraft = (d: DefectDraft | ReviewDraft) => { draft = d; };
export function takeDraft<K extends 'defect' | 'review'>(kind: K): (K extends 'defect' ? DefectDraft : ReviewDraft) | null {
  const d = draft;
  draft = null;
  return d && d.kind === kind ? (d as K extends 'defect' ? DefectDraft : ReviewDraft) : null;
}
