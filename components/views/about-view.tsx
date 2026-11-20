import { Illustration } from '../common/basics';
import { DrsLogo } from '../shell/logo';
import s from './about-view.module.css';

/** Label, illustration and text for each fact. */
const ROWS: [string, string, string][] = [
  ['Original stack', 'rack', 'React and Node.js, styled with Bootstrap and custom CSS. Synced with IBM Rational ClearQuest and ClearCase, Review Board, Perforce, Helix Swarm, Jira and Confluence.'],
  ['This demo', 'laptop', 'Recreated with modern tools: React on Vite, with React Router, Base UI components, Lucide icons and React Flow for the migration and relationship diagrams. Served from Cloudflare Workers; the app runs in the browser, and your changes are saved locally.'],
  ['Mock data', 'paper', 'January 2016 to September 2017: about 800 defects and 630 code reviews across 44 printer and copier models, 34 people in 8 teams and 3 migration waves. Generated deterministically, so every visitor starts from the same history.']
];

export function AboutView() {
  return (
    <div className={s.page}>
      <div className={s.intro}>
        <DrsLogo width={96} label="Defects and Reviews System logo" />
        <div className={s.heading}>
          <h1 className={s.title}>Defects and Reviews System</h1>
          <p className={s.subtitle}>Samsung Electronics, Printing Solutions Business, 2016-2017</p>
        </div>
      </div>
      {/* Rendered by `pnpm render:web` in video/. Bump the version in both file names when it changes, since public/_headers caches them for a year.
          The video plays from /stream, which sends the parts of public/video/drs-showcase-v2.mp4 the player asks for, so it can seek. */}
      <figure className={s.figure}>
        <video
          className={s.video}
          controls
          playsInline
          preload="metadata"
          poster="/video/drs-showcase-v2.webp"
          aria-label="DRS showcase video"
        >
          <source src="/stream/drs-showcase-v2.mp4" type="video/mp4" />
        </video>
        <figcaption className={s.caption}>A one-minute tour of DRS, with music</figcaption>
      </figure>
      <section className={s.story}>
        <p>This is a demo of an application I built at Samsung Electronics' printing division.</p>
        <p>DRS tracks defects and code reviews for printer and copier firmware, measures them against severity targets, and keeps records linked across IBM Rational, Review Board, Perforce, Helix Swarm, Jira and Confluence.</p>
        <p>Defects, code reviews, people, email addresses and engineering specs are mock data. Printer model numbers are made up, and the product photos are generated stand-ins. Samsung and its product line names appear only for context.</p>
        <p>Some of the original libraries have been deprecated and are no longer available, so they have been replaced with newer ones.</p>
        <p className={s.disclaimer}>This demo is not affiliated with or endorsed by Samsung Electronics. Samsung is a trademark of its owner.</p>
      </section>
      <section className={s.facts}>
        {ROWS.map(([k, art, v]) => (
          <div key={k} className={s.fact}>
            <span className={s.factArt}><Illustration name={art} height={72} /></span>
            <div className={s.factBody}>
              <span className={s.factKey}>{k}</span>
              <span className={s.factValue}>{v}</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
