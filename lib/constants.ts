import type { DefectStatus, MigState, Model, Resolution, ReviewStatus, Role, Severity, Team, User } from './types';

export const ORG = 'Samsung Electronics';
export const DIVISION = 'Printing Solutions Business';

export const TEAMS: Team[] = [
  { k: 'sel', name: 'Software Engineering Lab', desc: 'Firmware platform architecture, build infrastructure and internal engineering tools, including DRS.' },
  { k: 'sqa', name: 'Software Quality Assurance', desc: 'System, regression and field-issue verification for printer and copier firmware.' },
  { k: 'sdg1', name: 'Software Development Group I', desc: 'Print engine, scanner, fax and power-management firmware.' },
  { k: 'sdg2', name: 'Software Development Group II', desc: 'Control panel UI, SyncThru Web Service and print drivers.' },
  { k: 'adg', name: 'Application Development Group (Android)', desc: 'Samsung Mobile Print, Wi-Fi Direct and Android-based Smart UX panel apps.' },
  { k: 'sol', name: 'Solutions Development Group', desc: 'Secure printing, card authentication and B2B workflow solutions.' },
  { k: 'crt', name: 'Code Review Team', desc: 'Assigns reviewers and reviews every code change before it is submitted.' },
  { k: 'hw', name: 'Hardware Engineering Group', desc: 'Paper path, mechanism, sensor and supplies interface design.' }
];
export const TM: Record<string, Team> = Object.fromEntries(TEAMS.map(t => [t.k, t]));

type UserSeed = Omit<User, 'email' | 'photo' | 'site'>;
const USER_SEED: UserSeed[] = [
  { id: 'u1', name: '김지현', en: 'Jihyun Kim', title: 'Senior QA Engineer', role: 'qa', team: 'sqa', h: 293, intro: '프린터 펌웨어 시스템 테스트를 담당합니다. 양면 인쇄와 용지 경로 회귀 테스트 시나리오를 관리합니다.' },
  { id: 'u2', name: '박성민', en: 'Sungmin Park', title: 'Senior Firmware Engineer', role: 'eng', team: 'sdg1', h: 250, intro: '컬러 레이저 프린트 엔진 펌웨어 개발. 모터 제어와 정착기 온도 제어를 주로 맡고 있습니다.' },
  { id: 'u3', name: '이수진', en: 'Sujin Lee', title: 'Software Engineer', role: 'eng', team: 'sdg2', h: 330, intro: '4.3인치 / 7인치 조작부 UI 개발. 다국어 리소스와 접근성 개선을 담당합니다.' },
  { id: 'u4', name: 'Rahul Sharma', en: 'Rahul Sharma', title: 'Firmware Engineer, SRI-Bangalore', role: 'eng', team: 'sdg1', h: 200, intro: 'Works on fax, network and power-management firmware from the Bangalore R&D center.' },
  { id: 'u5', name: '최영호', en: 'Youngho Choi', title: 'Principal Hardware Engineer', role: 'eng', team: 'hw', h: 160, intro: '용지 이송 메커니즘과 센서 설계 담당. 엔진 펌웨어 팀과 Jam 원인 분석을 함께 합니다.' },
  { id: 'u6', name: '정민아', en: 'Mina Jung', title: 'Code Reviewer', role: 'cr', team: 'crt', h: 30, intro: '펌웨어 C 코드와 조작부 UI 변경 리뷰를 주로 맡고 있습니다.' },
  { id: 'u7', name: '한도윤', en: 'Doyoon Han', title: 'Code Review Team Lead', role: 'cr', team: 'crt', h: 270, intro: '리뷰어 배정과 코드 리뷰 가이드라인 관리를 담당합니다.' },
  { id: 'u8', name: 'Priya Nair', en: 'Priya Nair', title: 'QA Engineer, SRI-Bangalore', role: 'qa', team: 'sqa', h: 80, intro: 'Leads regression testing for SyncThru Web Service and network features.' },
  { id: 'u9', name: 'Daniel Becker', en: 'Daniel Becker', title: 'Software Engineer', role: 'eng', team: 'sdg2', h: 220, intro: 'Builds SyncThru Web Service features and maintains the PCL6 driver. Joined the Suwon team from Samsung Electronics Germany in 2015.' },
  { id: 'u10', name: '오세훈', en: 'Sehoon Oh', title: 'Software Engineer', role: 'eng', team: 'adg', h: 310, intro: 'Samsung Mobile Print 앱과 보안 인쇄 솔루션 개발. 앱과 펌웨어 연동을 담당합니다.' },
  { id: 'u11', name: '윤재석', en: 'Jaeseok Yoon', title: 'Code Reviewer', role: 'cr', team: 'crt', h: 180, intro: 'Reviews network stack, print driver and web service changes.' },
  { id: 'u12', name: '강태준', en: 'Taejun Kang', title: 'Principal Engineer, Lab Lead', role: 'eng', team: 'sel', h: 120, intro: '소프트웨어 엔지니어링 랩장. 펌웨어 플랫폼 아키텍처와 개발 프로세스, 도구 전환 프로젝트를 총괄합니다.' },
  { id: 'u13', name: 'Arjun Mehta', en: 'Arjun Mehta', title: 'Senior Engineer, Build Infrastructure', role: 'eng', team: 'sel', h: 45, intro: 'Owns the firmware build farm and the continuous integration pipeline for all printer models. Wrote the DRS sync jobs for ClearQuest and Jira.' },
  { id: 'u14', name: '서지원', en: 'Jiwon Seo', title: 'Software Engineer, Static Analysis', role: 'eng', team: 'sel', h: 350, intro: '정적 분석 도구 도입과 코딩 규칙 점검 자동화를 담당합니다. 보안 취약점 점검 결과도 관리합니다.' },
  { id: 'u15', name: '임하늘', en: 'Haneul Lim', title: 'QA Engineer', role: 'qa', team: 'sqa', h: 140, intro: '팩스와 스캔 기능 검증 담당. 해외 통신 환경 테스트베드를 운영합니다.' },
  { id: 'u16', name: 'Sneha Iyer', en: 'Sneha Iyer', title: 'QA Engineer, SRI-Bangalore', role: 'qa', team: 'sqa', h: 10, intro: 'Tests print drivers across Windows and macOS releases.' },
  { id: 'u17', name: '장현우', en: 'Hyunwoo Jang', title: 'Firmware Engineer', role: 'eng', team: 'sdg1', h: 240, intro: '팩스와 절전 모드 펌웨어 개발. 에너지스타와 저전력 인증 대응을 맡고 있습니다.' },
  { id: 'u18', name: '신유나', en: 'Yuna Shin', title: 'Software Engineer, Print Driver', role: 'eng', team: 'sdg2', h: 300, intro: 'Universal Print Driver와 PostScript 드라이버 개발을 담당합니다.' },
  { id: 'u19', name: '노지훈', en: 'Jihoon Noh', title: 'Android Engineer, Group Lead', role: 'eng', team: 'adg', h: 190, intro: '애플리케이션 개발 그룹장. Android 기반 Smart UX 조작부 앱 플랫폼을 이끌고 있습니다.' },
  { id: 'u20', name: 'Vikram Rao', en: 'Vikram Rao', title: 'Android Engineer, SRI-Bangalore', role: 'eng', team: 'adg', h: 60, intro: 'Works on Samsung Mobile Print, focused on Wi-Fi Direct, NFC pairing and Mopria.' },
  { id: 'u21', name: '김다은', en: 'Daeun Kim', title: 'Android Engineer', role: 'eng', team: 'adg', h: 320, intro: 'Android 조작부 앱 UI 개발. 다국어 폰트와 레이아웃을 담당합니다.' },
  { id: 'u22', name: '배준혁', en: 'Junhyuk Bae', title: 'Hardware Engineer, Sensors', role: 'eng', team: 'hw', h: 100, intro: '용지 감지 센서와 토너 카트리지 칩(CRUM) 인터페이스 설계를 담당합니다.' },
  { id: 'u23', name: '최수빈', en: 'Subin Choi', title: 'QA Engineer, A3 Products', role: 'qa', team: 'sqa', h: 345, intro: 'MultiXpress A3 복합기의 복사, 피니셔, 카드 인증 기능 검증을 담당합니다.' },
  { id: 'u24', name: 'Ankit Verma', en: 'Ankit Verma', title: 'QA Automation Engineer, SRI-Bangalore', role: 'qa', team: 'sqa', h: 170, intro: 'Maintains the nightly regression rigs and the security scan suite that runs against every release candidate.' },
  { id: 'u25', name: '송민재', en: 'Minjae Song', title: 'Firmware Engineer, Imaging', role: 'eng', team: 'sdg1', h: 210, intro: '스캐너와 ADF 이미지 처리 파이프라인, 복사 화질 튜닝을 담당합니다.' },
  { id: 'u26', name: '황보라', en: 'Bora Hwang', title: 'Software Engineer, SyncThru', role: 'eng', team: 'sdg2', h: 15, intro: 'SyncThru Web Service 보안 설정과 인증서 관리 기능을 개발합니다.' },
  { id: 'u27', name: 'Kavya Reddy', en: 'Kavya Reddy', title: 'Software Engineer, Print Driver, SRI-Bangalore', role: 'eng', team: 'sdg2', h: 285, intro: 'Develops the Universal Print Driver UI and its Windows spooler integration.' },
  { id: 'u28', name: '문준영', en: 'Junyoung Moon', title: 'Senior Code Reviewer, Security', role: 'cr', team: 'crt', h: 230, intro: '보안 관련 변경과 암호화, 인증 코드 리뷰를 담당합니다.' },
  { id: 'u29', name: 'Rohan Desai', en: 'Rohan Desai', title: 'Code Reviewer, SRI-Bangalore', role: 'cr', team: 'crt', h: 130, intro: 'Reviews driver, Android and build changes from the Bangalore teams.' },
  { id: 'u30', name: '조은비', en: 'Eunbi Jo', title: 'Software Engineer, Solutions', role: 'eng', team: 'sol', h: 340, intro: '보안 인쇄와 사원증 카드 인증 솔루션을 개발합니다.' },
  { id: 'u31', name: 'Neha Kapoor', en: 'Neha Kapoor', title: 'Software Engineer, Solutions, SRI-Bangalore', role: 'eng', team: 'sol', h: 50, intro: 'Builds print quota and accounting features for enterprise customers.' },
  { id: 'u32', name: '권태현', en: 'Taehyun Kwon', title: 'Solutions Group Lead', role: 'eng', team: 'sol', h: 260, intro: '솔루션 개발 그룹장. 공공기관과 금융권 납품 모델의 보안 요구사항을 관리합니다.' },
  { id: 'u33', name: '유하린', en: 'Harin Yoo', title: 'Mechanical Engineer, Finisher', role: 'eng', team: 'hw', h: 110, intro: 'A3 복합기 피니셔와 스테이플러, 펀치 유닛 설계를 담당합니다.' },
  { id: 'u34', name: 'Sanjay Pillai', en: 'Sanjay Pillai', title: 'Build and Release Engineer, SRI-Bangalore', role: 'eng', team: 'sel', h: 90, intro: 'Runs firmware release builds and moved the build farm to the new Perforce stream layout in 2017.' }
];

export const USERS: User[] = USER_SEED.map(u => ({
  ...u,
  // A reserved domain: the mock names could belong to real people.
  email: u.en.toLowerCase().replace(/\s+/g, '.') + '@example.com',
  photo: '/photos/' + u.id + '.webp',
  site: /SRI-Bangalore/.test(u.title) ? 'Bangalore, India' : 'Suwon, Korea'
}));
export const UM: Record<string, User> = Object.fromEntries(USERS.map(u => [u.id, u]));
export const ROLE: Record<Role, string> = { qa: 'QA', eng: 'Engineer', cr: 'Code Review Team' };

export const MODELS: Model[] = (
  [
    ['PS-M2110W', 'Xpress', 'Mono laser printer', '2013-Q3'], ['PS-M2160FW', 'Xpress', 'Mono laser MFP', '2013-Q3'],
    ['PS-M2920DW', 'Xpress', 'Mono laser printer', '2014-Q2'], ['PS-M2970FW', 'Xpress', 'Mono laser MFP', '2014-Q2'],
    ['PS-M2925DW', 'Xpress', 'Mono laser printer', '2016-Q2'], ['PS-M2975FW', 'Xpress', 'Mono laser MFP', '2016-Q2'],
    ['PS-C520W', 'Xpress', 'Color laser printer', '2014-Q3'], ['PS-C570FW', 'Xpress', 'Color laser MFP', '2014-Q3'],
    ['PS-C1900W', 'Xpress', 'Color laser printer', '2014-Q1'], ['PS-C1950FW', 'Xpress', 'Color laser MFP', '2014-Q1'],
    ['PS-M3410ND', 'ProXpress', 'Mono laser printer', '2014-Q1'], ['PS-M3910ND', 'ProXpress', 'Mono laser printer', '2014-Q1'],
    ['PS-M3960FW', 'ProXpress', 'Mono laser MFP', '2014-Q2'], ['PS-M4110ND', 'ProXpress', 'Mono laser printer', '2014-Q2'],
    ['PS-M4160FR', 'ProXpress', 'Mono laser MFP', '2014-Q2'], ['PS-M4170FX', 'ProXpress', 'Mono laser MFP', '2015-Q1'],
    ['PS-M4620ND', 'ProXpress', 'Mono laser printer', '2014-Q4'], ['PS-M4670FX', 'ProXpress', 'Mono laser MFP', '2014-Q4'],
    ['PS-M3105DW', 'ProXpress', 'Mono laser printer', '2016-Q3'], ['PS-M3155FW', 'ProXpress', 'Mono laser MFP', '2016-Q3'],
    ['PS-M4115ND', 'ProXpress', 'Mono laser printer', '2017-Q1'], ['PS-M4165FR', 'ProXpress', 'Mono laser MFP', '2017-Q1'],
    ['PS-C2710DW', 'ProXpress', 'Color laser printer', '2015-Q2'], ['PS-C2760FW', 'ProXpress', 'Color laser MFP', '2015-Q2'],
    ['PS-C3100ND', 'ProXpress', 'Color laser printer', '2015-Q3'], ['PS-C3150FR', 'ProXpress', 'Color laser MFP', '2015-Q3'],
    ['PS-C4100ND', 'ProXpress', 'Color laser printer', '2016-Q1'], ['PS-C4150FX', 'ProXpress', 'Color laser MFP', '2016-Q1'],
    ['PS-C2770FX', 'ProXpress', 'Color laser MFP', '2017-Q2'],
    ['PS-K2290ND', 'MultiXpress', 'Mono A3 copier', '2015-Q1'], ['PS-K4340RX', 'MultiXpress', 'Mono A3 copier', '2015-Q3'],
    ['PS-K4440LX', 'MultiXpress', 'Mono A3 copier', '2015-Q3'], ['PS-K7690LX', 'MultiXpress', 'Mono A3 copier', '2015-Q4'],
    ['PS-K4390LX', 'MultiXpress', 'Mono A3 copier', '2016-Q4'], ['PS-K7490LX', 'MultiXpress', 'Mono A3 copier', '2016-Q4'],
    ['PS-K7590LX', 'MultiXpress', 'Mono A3 copier', '2016-Q4'],
    ['PS-X3310NR', 'MultiXpress', 'Color A3 copier', '2015-Q2'], ['PS-X3370NR', 'MultiXpress', 'Color A3 copier', '2015-Q2'],
    ['PS-X4310RX', 'MultiXpress', 'Color A3 copier', '2015-Q4'], ['PS-X4390LX', 'MultiXpress', 'Color A3 copier', '2015-Q4'],
    ['PS-X7490LX', 'MultiXpress', 'Color A3 copier', '2015-Q4'], ['PS-X7590LX', 'MultiXpress', 'Color A3 copier', '2015-Q4'],
    ['PS-X7690LX', 'MultiXpress', 'Color A3 copier', '2015-Q4'], ['PS-X4340LX', 'MultiXpress', 'Color A3 copier', '2017-Q1']
  ] as const
).map(([id, series, kind, launch]) => ({ id, series, kind, launch }));
export const MIDS = MODELS.map(m => m.id);
export const MM: Record<string, Model> = Object.fromEntries(MODELS.map(m => [m.id, m]));

export const COMPS = [
  'Print Engine', 'Scanner / ADF', 'Copy', 'Fax', 'Network / Wi-Fi', 'SyncThru Web UI', 'Panel UI', 'Print Driver',
  'Mobile Print', 'Security', 'Finisher', 'Toner / Supplies', 'Power / Sleep'
];

export const TYPES = ['Bug fix', 'Feature', 'Firmware update', 'Refactor', 'Performance', 'Security fix', 'Localization', 'Build / CI', 'Test', 'Documentation', 'Other'];
export const TYPE_ICON: Record<string, string> = {
  'Bug fix': 'bug', Feature: 'sparkles', 'Firmware update': 'cpu', Refactor: 'wrench', Performance: 'gauge', 'Security fix': 'shield-check',
  Localization: 'languages', 'Build / CI': 'hammer', Test: 'flask-conical', Documentation: 'book-open', Other: 'ellipsis'
};

export const SEV: Record<Severity, { l: string; c: string; cb: string; icon: string }> = {
  critical: { l: 'Critical', c: 'oklch(0.55 0.2 25)', cb: 'oklch(0.6 0.2 25)', icon: 'chevrons-up' },
  major: { l: 'Major', c: 'oklch(0.6 0.15 50)', cb: 'oklch(0.73 0.16 55)', icon: 'chevron-up' },
  minor: { l: 'Minor', c: 'oklch(0.6 0.12 90)', cb: 'oklch(0.86 0.14 95)', icon: 'minus' },
  trivial: { l: 'Trivial', c: 'oklch(0.58 0.02 260)', cb: 'oklch(0.83 0.01 260)', icon: 'chevron-down' }
};
export const SEVORD: Severity[] = ['trivial', 'minor', 'major', 'critical'];

export const DST: Record<DefectStatus, { l: string; fg: string; icon: string }> = {
  open: { l: 'Open', fg: 'oklch(0.48 0.18 293)', icon: 'circle' },
  in_progress: { l: 'In progress', fg: 'oklch(0.48 0.14 250)', icon: 'circle-dot' },
  resolved: { l: 'Resolved', fg: 'oklch(0.48 0.12 155)', icon: 'circle-check' },
  closed: { l: 'Closed', fg: 'oklch(0.48 0.01 290)', icon: 'lock' }
};
export const DST_KEYS = Object.keys(DST) as DefectStatus[];
export const RESOLUTION: Record<Resolution, string> = { fixed: 'Fixed', duplicate: 'Duplicate', cannot_reproduce: 'Cannot reproduce', as_designed: 'Works as designed' };
export const RESOLUTION_KEYS = Object.keys(RESOLUTION) as Resolution[];

export const RST: Record<ReviewStatus, { l: string; fg: string; icon: string }> = {
  pending: { l: 'Awaiting reviewer', fg: 'oklch(0.45 0.02 290)', icon: 'clock' },
  in_review: { l: 'In review', fg: 'oklch(0.48 0.18 293)', icon: 'eye' },
  changes: { l: 'Modification requested', fg: 'oklch(0.52 0.12 60)', icon: 'rotate-ccw' },
  approved: { l: 'Approved', fg: 'oklch(0.46 0.12 155)', icon: 'circle-check' },
  denied: { l: 'Denied', fg: 'oklch(0.52 0.18 25)', icon: 'ban' },
  withdrawn: { l: 'Withdrawn', fg: 'oklch(0.48 0.01 290)', icon: 'archive' }
};
export const RST_KEYS = Object.keys(RST) as ReviewStatus[];
export const DEC: Record<string, string> = { approved: 'Approved', changes: 'Requested modification', denied: 'Denied', withdrawn: 'Withdrawn' };

export const MUTED = 'oklch(0.5 0.02 290)';
export const GOOD = 'oklch(0.46 0.12 155)';
export const BAD = 'oklch(0.52 0.18 25)';
export const AMBER = 'oklch(0.55 0.13 65)';
export const ACCENT = 'oklch(0.5 0.19 293)';
export const ACCENT_INK = 'oklch(0.45 0.17 293)';

/** Response and resolution targets per severity (hours to respond, days to resolve). */
export const TGT: Record<Severity, { r: number; f: number; rl: string; fl: string }> = {
  critical: { r: 4, f: 2, rl: '4 hours', fl: '2 days' },
  major: { r: 24, f: 7, rl: '1 day', fl: '7 days' },
  minor: { r: 72, f: 21, rl: '3 days', fl: '21 days' },
  trivial: { r: 120, f: 45, rl: '5 days', fl: '45 days' }
};

/** Migration wave per component. Components not listed move in wave 3. */
export const WAVE: Record<string, number> = {
  'SyncThru Web UI': 1, 'Print Driver': 1, 'Mobile Print': 1,
  'Panel UI': 2, 'Network / Wi-Fi': 2, Fax: 2, 'Power / Sleep': 2, Security: 2
};
export const WAVE_CUTOVER: Record<number, string> = { 1: 'Nov 2016', 2: 'Apr 2017', 3: 'Dec 2017' };
/** First day each wave works only in Perforce and Helix Swarm. */
export const WAVE_CUTOVER_DAY: Record<number, string> = { 1: '2016-11-01', 2: '2017-04-01', 3: '2017-12-01' };
export const MIG: Record<MigState, { l: string; d: string; c: string; fg: string; icon: string }> = {
  jira: { l: 'Migrated to Jira', d: 'Jira leads; the ClearQuest record is read-only', c: 'oklch(0.5 0.19 293)', fg: 'oklch(0.42 0.19 293)', icon: 'check-check' },
  mirrored: { l: 'Mirrored', d: 'ClearQuest leads; DRS keeps a Jira copy in sync', c: 'oklch(0.74 0.11 293)', fg: 'oklch(0.48 0.16 293)', icon: 'arrow-left-right' },
  legacy: { l: 'Legacy only', d: "ClearQuest only; moves with its team's wave", c: 'oklch(0.87 0.02 290)', fg: 'oklch(0.45 0.02 290)', icon: 'archive' }
};
export const MIGORD: MigState[] = ['jira', 'mirrored', 'legacy'];

export const CQ_STATE: Record<DefectStatus, string> = { open: 'Submitted', in_progress: 'Opened', resolved: 'Resolved', closed: 'Closed' };
export const CQ_PRI: Record<Severity, string> = { critical: '1 - Resolve immediately', major: '2 - Give high attention', minor: '3 - Normal queue', trivial: '4 - Low priority' };
export const JIRA_ST: Record<DefectStatus, string> = { open: 'To Do', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Done' };

export const LOGO: Record<string, string> = {
  'Rational ClearQuest': '/logos/ibm.svg',
  'Rational ClearCase': '/logos/ibm.svg',
  Jira: '/logos/jira.svg',
  Confluence: '/logos/confluence.svg',
  'Perforce P4': '/logos/perforce.svg',
  'Helix Swarm': '/logos/perforce.svg',
  'Review Board': '/logos/reviewboard.png'
};

export const SYSG = [
  {
    label: 'Legacy',
    note: 'IBM Rational and Review Board, retiring team by team',
    items: [
      { name: 'Rational ClearQuest', role: 'Defect and change-request records', ago: '5 min' },
      { name: 'Rational ClearCase', role: 'UCM activities and pre-migration source history', ago: '1 hr' },
      { name: 'Review Board', role: 'Code review for teams not yet on Helix Swarm', ago: '4 min' }
    ]
  },
  {
    label: 'New',
    note: 'Perforce and Atlassian, rolling out in waves',
    items: [
      { name: 'Jira', role: 'Issues for teams that have moved', ago: '3 min' },
      { name: 'Perforce P4', role: 'Source, jobs and changelists', ago: '1 min' },
      { name: 'Helix Swarm', role: 'Code review', ago: '2 min' },
      { name: 'Confluence', role: 'Test reports and root-cause pages', ago: '12 min' }
    ]
  }
].map(g => ({ ...g, items: g.items.map(s => ({ ...s, logo: LOGO[s.name] })) }));

/** Rows per page in lists. */
export const PS = 15;
