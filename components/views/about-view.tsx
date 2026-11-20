import { Illustration, PageHeader, Section } from '../common/basics';
import { SystemMap } from '../graphs/system-map';
import s from './about-view.module.css';

/**
 * How the move from IBM Rational and Review Board to Perforce and Atlassian works, one short point each, led by an
 * illustration. The facts match the generated data: waves and cutovers in WAVE and WAVE_CUTOVER, the three migration
 * states in MIG (lib/constants.ts), and the ClearCase and Review Board rules in lib/records.ts and lib/views.ts.
 */
const STEPS: { art: string; title: string; text: string }[] = [
  { art: 'truck', title: 'Components move in waves', text: 'Each component moves on its wave’s cutover date, from November 2016 to December 2017.' },
  { art: 'padlock', title: 'One system leads each defect', text: 'ClearQuest leads until a component moves. Then Jira leads and ClearQuest turns read-only.' },
  { art: 'box', title: 'History comes along', text: 'ClearCase and Review Board history is imported into Perforce and Helix Swarm.' },
  { art: 'gears', title: 'Every record stays linked', text: 'Each defect and code review lists its record in every system, kept in sync.' }
];

export function AboutView() {
  return (
    <div className={s.page}>
      <PageHeader title="About" />
      <p className={s.lead}>
        DRS keeps every defect and code review whole through the move: it links each record across all seven systems, keeps them in sync, and shows which system leads.
      </p>

      <SystemMap />

      <Section title="How the move works" gap={32}>
        <div className={s.steps}>
          {STEPS.map(st => (
            <div key={st.title} className={s.step}>
              <Illustration name={st.art} height={80} />
              <div className={s.stepText}>
                <h3 className={s.stepTitle}>{st.title}</h3>
                <p>{st.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Rendered by `pnpm render:web` in video/. Bump the version in both file names when it changes, since public/_headers caches them for a year.
          The video plays from /stream, which sends the parts of public/video/drs-showcase-v2.mp4 the player asks for, so it can seek. */}
      <video
        className={s.video}
        controls
        playsInline
        preload="metadata"
        poster="/video/drs-showcase-v2.webp"
        aria-label="DRS showcase video, a one-minute tour with music"
      >
        <source src="/stream/drs-showcase-v2.mp4" type="video/mp4" />
      </video>

      <p className={s.disclaimer}>
        Defects, code reviews, people, email addresses and engineering specs are mock data. Printer model numbers are made up, and the product photos are generated stand-ins.
      </p>
    </div>
  );
}
