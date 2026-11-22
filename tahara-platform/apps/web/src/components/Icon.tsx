/** Thin line icons (24px grid, 1.6 stroke). Decorative unless `label` is given. */
const PATHS = {
  home: 'M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1v-8.5Z',
  calendar:
    'M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 8h2m4 0h2m-8 4h2',
  track: 'M12 20h8M4 20l1-4L16 5a2.1 2.1 0 0 1 3 3L8 19l-4 1Z',
  drop: 'M12 3c3.5 4.2 5.5 7.3 5.5 10a5.5 5.5 0 0 1-11 0c0-2.7 2-5.8 5.5-10Z',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  fertility:
    'M12 21a7 7 0 0 0 7-7c0-4-3-7-7-11-4 4-7 7-7 11a7 7 0 0 0 7 7Zm0-4a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  stats: 'M4 20V10m6 10V4m6 16v-7m4 7H3',
  history: 'M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5m4-1v5l3 2',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Zm4 3a2 2 0 0 0 4 0',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.5 7.5 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7.5 7.5 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z',
  shield: 'M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-4',
  support:
    'M8 10h8m-8 4h5m-7 6 2.5-3H18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2',
  plus: 'M12 5v14M5 12h14',
  check: 'm5 12 4.5 4.5L19 7',
  chevron: 'm15 6-6 6 6 6',
  chevronNext: 'm9 6 6 6-6 6',
  edit: 'M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z',
  trash: 'M5 7h14m-9 0V5h4v2m-7 0 1 12h8l1-12',
  sparkle: 'M12 4v4m0 8v4m8-8h-4M8 12H4m12.5-4.5-2 2m-5 5-2 2m9 0-2-2m-5-5-2-2',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z',
  sun: 'M12 3v2m0 14v2m9-9h-2M5 12H3m15.4-6.4-1.4 1.4M7 17l-1.4 1.4m12.8 0L17 17M7 7 5.6 5.6M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  thermometer: 'M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0Z',
  flask: 'M9 3h6m-5 0v6L5 18a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3L14 9V3',
  symptom: 'M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10Z',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6v-9Z',
  download: 'M12 4v11m0 0-4-4m4 4 4-4M5 19h14',
  upload: 'M12 20V9m0 0-4 4m4-4 4 4M5 5h14',
  book: 'M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4V4Zm0 12a4 4 0 0 1 4-4h10',
  info: 'M12 8h.01M11 12h1v5h1M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  className = 'size-5',
  label,
}: {
  name: IconName;
  className?: string;
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
