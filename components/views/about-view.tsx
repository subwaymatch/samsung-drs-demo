import { Illustration, PageHeader, Section } from '../common/basics';
import { SystemMap } from '../graphs/system-map';
import s from './about-view.module.css';

/**
 * How the move from IBM Rational and Review Board to Perforce and Atlassian works, each point led by an
 * illustration. The facts match the generated data: waves and cutovers in WAVE and WAVE_CUTOVER, the three
 * migration states in MIG (lib/constants.ts), and the ClearCase and Review Board rules in lib/records.ts and lib/views.ts.
 */
const STEPS: { art: string; title: string; text: string }[] = [
  {
    art: 'truck',
    title: 'Components move in waves',
    text: 'Each component moves on its wave’s cutover date. SyncThru Web UI, Print Driver and Mobile Print went first, in November 2016. Panel UI, Network / Wi-Fi, Fax, Power / Sleep and Security followed in April 2017, and Print Engine and the remaining components move in December 2017.'
  },
  {
    art: 'padlock',
    title: 'One system leads each defect',
    text: 'A defect lives only in ClearQuest until its component moves. While it is mirrored, ClearQuest still leads and DRS keeps a Jira copy in sync. Once it has migrated, Jira leads and the ClearQuest record becomes read-only.'
  },
  {
    art: 'box',
    title: 'History comes along',
    text: 'At each cutover, the wave’s ClearCase stream is frozen and its history imported into Perforce. A stream that is still in use is imported every hour. Review Board reviews are mirrored to Helix Swarm, and their comments and Ship It votes are imported when the team moves.'
  },
  {
    art: 'gears',
    title: 'Every record stays linked',
    text: 'Each defect has a Perforce job, and fixes are recorded on it with p4 fix. Root-cause pages and test reports live in Confluence. Every defect and code review page lists its record in each system, and Sync now refreshes them all.'
  }
];

export function AboutView() {
  return (
    <div className={s.page}>
      <PageHeader title="About" />

      <Section title="Defects and Reviews System" sub="Samsung Electronics, Printing Solutions Business, 2016-2017" gap={32}>
        <p className={s.lead}>
          The printing division is moving its firmware teams from IBM Rational and Review Board to Perforce and Atlassian. DRS keeps every defect and code review whole through the move: it links each record across all seven systems, keeps them in sync, and shows which system leads.
        </p>
        <SystemMap />
      </Section>

      <Section title="How the move works" sub="Components, records and their history, from the legacy systems to the new ones" gap={32}>
        <div className={s.steps}>
          {STEPS.map(st => (
            <div key={st.title} className={s.step}>
              <Illustration name={st.art} height={96} />
              <div className={s.stepText}>
                <h3 className={s.stepTitle}>{st.title}</h3>
                <p>{st.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Video tour" sub="A one-minute tour of DRS, with music">
        {/* Rendered by `pnpm render:web` in video/. Bump the version in both file names when it changes, since public/_headers caches them for a year.
            The video plays from /stream, which sends the parts of public/video/drs-showcase-v2.mp4 the player asks for, so it can seek. */}
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
      </Section>

      <p className={s.disclaimer}>
        Defects, code reviews, people, email addresses and engineering specs are mock data. Printer model numbers are made up, and the product photos are generated stand-ins. This demo is not affiliated with or endorsed by Samsung Electronics. Samsung is a trademark of its owner.
      </p>
    </div>
  );
}
