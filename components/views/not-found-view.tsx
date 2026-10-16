'use client';

import { useEffect } from 'react';
import { LinkButton } from '../ui/button';

/** The page for a missing record or route, linking back to the list it belongs to. */
export function NotFoundView({ text = 'This item may have been deleted.', back = { href: '/', label: 'Insights' } }: { text?: string; back?: { href: string; label: string } }) {
  // Record pages are titled with the id from the URL; say what happened instead.
  useEffect(() => {
    document.title = 'Not found - DRS';
  }, []);
  return (
    <div className="mx-auto my-20 flex max-w-[760px] flex-col items-start gap-4">
      <h1 className="text-2xl font-bold">Not found</h1>
      <p className="leading-[1.7] text-muted">{text}</p>
      <LinkButton href={back.href} variant="secondary" icon="arrow-left">Back to {back.label}</LinkButton>
    </div>
  );
}
