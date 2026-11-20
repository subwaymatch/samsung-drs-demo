import { useEffect } from 'react';
import { Illustration } from '../common/basics';
import { LinkButton } from '../ui/button';
import s from './not-found-view.module.css';

/** The page for a missing record or route, linking back to the list it belongs to. */
export function NotFoundView({ text = 'This item may have been deleted', back = { href: '/', label: 'Insights' } }: { text?: string; back?: { href: string; label: string } }) {
  // Record pages are titled with the id from the URL; say what happened instead.
  useEffect(() => {
    document.title = 'Not found - DRS';
  }, []);
  return (
    <div className={s.page}>
      {/* A printer with a page caught in its rollers: this division's own way for a page to go missing */}
      <Illustration name="jam" height={160} className={s.art} />
      <h1 className={s.title}>Not found</h1>
      <p className={s.text}>{text}</p>
      <LinkButton href={back.href} variant="secondary" icon="arrow-left">Back to {back.label}</LinkButton>
    </div>
  );
}
