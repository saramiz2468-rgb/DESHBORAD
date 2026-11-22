import type { IconName } from '@/components/Icon';

/**
 * Screens of the personal app.
 *  - `simulation`: fully designed and interactive in stage A, with data held
 *    only in the tab's memory (see state/store.tsx). Persistence comes in stage B.
 *  - `planned`: designed as an informational screen; not interactive yet.
 */
export type Availability = 'simulation' | 'planned';

export interface NavItem {
  href: `/${string}`;
  label: string;
  icon: IconName;
  availability: Availability;
  description?: string;
}

export const PRIMARY_NAV: readonly NavItem[] = [
  { href: '/today', label: 'בית', icon: 'home', availability: 'simulation' },
  { href: '/calendar', label: 'לוח שנה', icon: 'calendar', availability: 'simulation' },
  { href: '/track', label: 'מעקב', icon: 'track', availability: 'simulation' },
  { href: '/tahara', label: 'טהרה', icon: 'drop', availability: 'simulation' },
  { href: '/more', label: 'עוד', icon: 'more', availability: 'simulation' },
];

export const MORE_NAV: readonly NavItem[] = [
  {
    href: '/fertility',
    label: 'פוריות וביוץ',
    icon: 'fertility',
    availability: 'simulation',
    description: 'חלון פוריות, ביוץ ותיעוד',
  },
  {
    href: '/stats',
    label: 'סטטיסטיקות',
    icon: 'stats',
    availability: 'simulation',
    description: 'ממוצעים ומגמות לאורך זמן',
  },
  {
    href: '/history',
    label: 'היסטוריה',
    icon: 'history',
    availability: 'simulation',
    description: 'כל התיעוד לפי חודשים',
  },
  {
    href: '/reminders',
    label: 'תזכורות',
    icon: 'bell',
    availability: 'simulation',
    description: 'מה להזכיר ומתי',
  },
  {
    href: '/settings',
    label: 'הגדרות',
    icon: 'settings',
    availability: 'simulation',
    description: 'מחזור, תצוגה והלכה',
  },
  {
    href: '/privacy',
    label: 'פרטיות ואבטחה',
    icon: 'shield',
    availability: 'simulation',
    description: 'ייצוא, נעילה ומחיקה',
  },
  {
    href: '/support',
    label: 'תמיכה',
    icon: 'support',
    availability: 'planned',
    description: 'פנייה לצוות',
  },
];

export const SUB_ROUTES: readonly NavItem[] = [
  { href: '/tahara/vestot', label: 'מעקב וסתות', icon: 'moon', availability: 'simulation' },
];

export const ALL_ROUTES: readonly NavItem[] = [...PRIMARY_NAV, ...MORE_NAV, ...SUB_ROUTES];

/** Desktop sidebar: primary areas (without "עוד") followed by the "עוד" items. */
export const SIDEBAR_NAV: readonly NavItem[] = [
  ...PRIMARY_NAV.filter((n) => n.href !== '/more'),
  ...MORE_NAV,
];
