import { DrsLogo } from '../shell/logo';

const ROWS: [string, string][] = [
  ['Original stack', 'React and Node.js, styled with Bootstrap and custom CSS. Synced with IBM Rational ClearQuest and ClearCase, Review Board, Perforce, Helix Swarm, Jira and Confluence.'],
  ['This demo', 'Recreated with modern tools: Vinext (the Next.js API on Vite) with React, Base UI components, Lucide icons and React Flow for the migration and relationship diagrams. Served from Cloudflare Workers; the app runs in the browser, and your changes are saved locally.'],
  ['Mock data', 'January 2016 to September 2017: about 800 defects and 630 code reviews across 44 printer and copier models, 34 people in 8 teams and 3 migration waves. Generated deterministically, so every visitor starts from the same history.']
];

export function AboutView() {
  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-10">
      <div className="flex flex-col gap-5">
        <DrsLogo width={96} label="Defects and Reviews System logo" />
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[36px] leading-[1.2] font-bold tracking-[-0.02em]">Defects and Reviews System</h1>
          <p className="text-base leading-[1.7] text-muted">Samsung Electronics · Printing Solutions Business · 2016–2017</p>
        </div>
      </div>
      <section className="flex max-w-[680px] flex-col gap-4 border-t border-line pt-6 text-lg leading-[1.7] text-pretty text-ink-3">
        <p>This is a demo of a product I built at Samsung Electronics’ printing division, where it was used by the Software Engineering Lab and the firmware, QA and code review teams in Suwon and Bangalore from 2016 to 2017.</p>
        <p>DRS tracked defects and code reviews for printer and copier firmware, measured them against severity targets, and kept records linked while teams moved from IBM Rational and Review Board to Perforce, Helix Swarm, Jira and Confluence.</p>
        <p>Printer models, defects, code reviews, people and other product and brand details have been replaced with mock data.</p>
        <p>Some of the original libraries have been deprecated and are no longer available, so they have been replaced with newer ones.</p>
      </section>
      <section className="flex max-w-[680px] flex-col text-base">
        {ROWS.map(([k, v], i) => (
          <div key={k} className={'flex flex-wrap gap-x-10 gap-y-2 border-t border-line py-5 ' + (i === ROWS.length - 1 ? 'border-b' : '')}>
            <span className="flex-[0_0_160px] font-semibold">{k}</span>
            <span className="min-w-0 flex-[1_1_280px] leading-[1.6] text-pretty text-ink-3">{v}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
