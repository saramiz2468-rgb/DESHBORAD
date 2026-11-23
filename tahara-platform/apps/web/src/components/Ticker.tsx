/** Running text strip under the top bar – same as the phone app. Decorative only. */
const WORDS = ['טהרה', 'מחזור', 'פוריות', 'ימי פרישה', 'שבעה נקיים', 'לוח עברי', 'פרטיות'];

export function Ticker() {
  const items = Array.from({ length: 4 }, () => WORDS).flat();
  return (
    <div aria-hidden className="flex h-8 items-center overflow-hidden border-b border-line">
      <div className="animate-[tick_32s_linear_infinite] text-[0.7rem] font-bold tracking-[0.08em] whitespace-nowrap text-ink-faint">
        {items.map((w, i) => (
          <span key={i}>
            {w}
            <span className="mx-2.5 text-rose">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
