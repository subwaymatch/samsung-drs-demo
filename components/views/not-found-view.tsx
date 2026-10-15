'use client';

import { LinkButton } from '../ui/button';

export function NotFoundView({ text = 'This item may have been deleted.' }: { text?: string }) {
  return (
    <div className="mx-auto my-20 flex max-w-[760px] flex-col items-start gap-4">
      <h1 className="text-2xl font-bold">Not found</h1>
      <p className="leading-[1.7] text-muted">{text}</p>
      <LinkButton href="/" variant="secondary" icon="arrow-left">Back to Insights</LinkButton>
    </div>
  );
}
