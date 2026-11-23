import type { ISODate } from '../calendar';

export type Onah = 'day' | 'night';

/** How the onah of a sighting was determined. */
export type OnahMode = 'auto' | 'day' | 'night-before-sunrise' | 'night-after-sunset' | 'unknown';

/** A regular sighting is computed; anything else requires personal halachic guidance. */
export type SightingKind = 'regular' | 'ketem' | 'unclear';
export type ComplexFlag = 'hormones' | 'postpartum' | 'miscarriage' | 'pregnancy' | 'nursing';

export interface SightingInput {
  id: string;
  date: ISODate;
  time?: string | undefined;
  onahMode: OnahMode;
  kind: SightingKind;
  flags?: ComplexFlag[] | undefined;
}

export interface Location {
  lat: number;
  lng: number;
  name: string;
}

export type MinhagKey = 'sephardi' | 'ashkenazi' | 'personal';

/** A veset kavua that a rabbi confirmed for this user (personal ruling layer). */
export interface FixedVeset {
  type: 'chodesh' | 'haflagah';
  /** Hebrew day of month (chodesh) or haflagah length in days (haflagah). */
  value: number;
  onah: Onah;
  confirmedBy?: string | undefined;
}

export interface HalachaSettings {
  minhag: MinhagKey;
  /** Detailed options – set per minhag preset or by the user's rabbi. */
  beinonitFullDay: boolean;
  beinonitDay31: boolean;
  ohrZarua: boolean;
  haflagotNotUprooted: boolean;
  fixedVeset?: FixedVeset | null | undefined;
}

export interface ResolvedSighting {
  id: string;
  civilDate: ISODate;
  /** The halachic day: a sighting after sunset belongs to the next day's night. */
  hdate: ISODate;
  onah: Onah | null;
  nearTwilight: boolean;
  computable: boolean;
  source: SightingInput;
}

export type EntryKind =
  | 'chodesh'
  | 'haflagah'
  | 'haflagah-old'
  | 'beinonit'
  | 'beinonit-other-onah'
  | 'beinonit-31'
  | 'ohr-zarua'
  | 'kavua';

export interface Explanation {
  basis: string[];
  interval?: number | undefined;
  computation: string;
  why: string;
  minhag: string;
  source: string;
}

export interface VesetEntry {
  kind: EntryKind;
  ruleId: string;
  label: string;
  hdate: ISODate;
  onah: Onah;
  window: { from: { date: ISODate; time: string }; to: { date: ISODate; time: string } };
  explanation: Explanation;
}

/** One separation onah, with every reason that applies to it. */
export interface Prishah {
  hdate: ISODate;
  onah: Onah;
  window: VesetEntry['window'];
  entries: VesetEntry[];
}

export type PatternKind =
  'chodesh-kavua' | 'haflagah-kavua' | 'chodesh-dilug' | 'haflagah-dilug' | 'sirug';

export interface PatternCandidate {
  kind: PatternKind;
  label: string;
  description: string;
  sightings: string[];
}

export type IssueKind =
  | 'unapproved-rules'
  | 'unknown-onah'
  | 'near-twilight'
  | 'complex-case'
  | 'chodesh-missing-day'
  | 'single-sighting'
  | 'no-sightings'
  | 'deviates-from-fixed';

export interface Issue {
  kind: IssueKind;
  severity: 'info' | 'warning';
  message: string;
  sightingId?: string | undefined;
}

export interface VestotResult {
  resolved: ResolvedSighting[];
  entries: VesetEntry[];
  prishot: Prishah[];
  upcoming: Prishah[];
  patterns: PatternCandidate[];
  issues: Issue[];
}
