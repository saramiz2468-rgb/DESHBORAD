'use client';

import { useId, useState, type ReactNode } from 'react';

/* Shared chart frame: title is the identity for single-series charts (no legend box). */
function ChartTable({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: string[];
  rows: ReactNode[][];
}) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-xs text-rose underline-offset-4 hover:underline">
        הצגה כטבלה
      </summary>
      <div className="mt-2 max-h-64 overflow-auto rounded-xl border border-line">
        <table className="w-full text-xs">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-surface-muted text-ink-soft">
            <tr>
              {head.map((h) => (
                <th key={h} scope="col" className="px-3 py-2 text-start font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-line">
                {r.map((c, j) => (
                  <td key={j} className="px-3 py-1.5 text-ink">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function Tooltip({
  x,
  yPct,
  children,
  width,
}: {
  x: number;
  yPct: number;
  children: ReactNode;
  width: number;
}) {
  const left = Math.min(Math.max(x, 70), width - 70);
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-plum px-3 py-2 text-xs whitespace-nowrap text-canvas shadow-lift"
      style={{ left: `${(left / width) * 100}%`, top: `${yPct}%` }}
    >
      {children}
    </div>
  );
}

/* ---------------- Cycle length bars ---------------- */

export interface BarDatum {
  key: string;
  label: string;
  value: number;
  detail: string;
}

export function CycleBarChart({
  title,
  data,
  average,
  unit = 'ימים',
}: {
  title: string;
  data: BarDatum[];
  average?: number | null;
  unit?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const titleId = useId();
  const W = 480;
  const H = 230;
  const pad = { top: 20, bottom: 36, side: 36 };
  const max = Math.max(...data.map((d) => d.value), average ?? 0, 10);
  const top = Math.ceil((max + 3) / 5) * 5;
  const innerW = W - pad.side * 2;
  const innerH = H - pad.top - pad.bottom;
  const slot = innerW / Math.max(data.length, 1);
  const barW = Math.min(26, slot * 0.55);
  const y = (v: number) => pad.top + innerH - (v / top) * innerH;
  // Right-to-left time: the oldest item is on the right.
  const x = (i: number) => W - pad.side - slot * i - slot / 2;
  const ticks = [0, top / 2, top];

  return (
    <figure aria-labelledby={titleId}>
      <figcaption id={titleId} className="mb-2 text-sm font-semibold text-ink">
        {title}
      </figcaption>
      <div className="relative">
        <svg
          direction="ltr"
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label={`${title}. ${data.length} פריטים${average ? `, ממוצע ${average}` : ''}`}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={pad.side}
                x2={W - pad.side}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--tk-line)"
                strokeWidth="1"
              />
              <text
                x={W - pad.side + 6}
                y={y(t) + 4}
                fontSize="13"
                fill="var(--tk-ink-faint)"
                textAnchor="start"
              >
                {t}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const h = Math.max(2, y(0) - y(d.value));
            return (
              <g key={d.key}>
                <rect
                  x={x(i) - slot / 2}
                  y={pad.top}
                  width={slot}
                  height={innerH}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${d.label}: ${d.value} ${unit}`}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="outline-none"
                />
                <path
                  d={`M${x(i) - barW / 2},${y(0)} v${-(h - 4)} q0,-4 4,-4 h${barW - 8} q4,0 4,4 v${h - 4} z`}
                  fill="var(--tk-rose)"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                  pointerEvents="none"
                />
                <text
                  x={x(i)}
                  y={H - 12}
                  fontSize="13"
                  fill="var(--tk-ink-faint)"
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
          {average ? (
            <g pointerEvents="none">
              <line
                x1={pad.side}
                x2={W - pad.side}
                y1={y(average)}
                y2={y(average)}
                stroke="var(--tk-gold)"
                strokeWidth="2"
                strokeDasharray="5 5"
              />
              <text x={pad.side} y={y(average) - 6} fontSize="13" fill="var(--tk-ink-soft)">
                ממוצע {average}
              </text>
            </g>
          ) : null}
        </svg>
        {hover !== null && data[hover] ? (
          <Tooltip x={x(hover)} yPct={(y(data[hover].value) / H) * 100 - 2} width={W}>
            <strong className="font-semibold">
              {data[hover].value} {unit}
            </strong>
            <span className="ms-2 opacity-80">{data[hover].detail}</span>
          </Tooltip>
        ) : null}
      </div>
      <ChartTable
        caption={title}
        head={['תקופה', unit]}
        rows={data.map((d) => [d.detail, d.value])}
      />
    </figure>
  );
}

/* ---------------- Fertility chart (one cycle) ---------------- */

export interface FertilityDay {
  date: string;
  label: string;
  cycleDay: number;
  bleed: boolean;
  bbt?: number | undefined;
  lh?: 'positive' | 'negative' | undefined;
  fertile: boolean;
  ovulation: boolean;
}

export function FertilityChart({ title, days }: { title: string; days: FertilityDay[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const titleId = useId();
  const W = 480;
  const H = 300;
  const pad = { top: 26, bottom: 66, side: 44, axis: 58 };
  const innerW = W - pad.side - pad.axis;
  const innerH = H - pad.top - pad.bottom;
  const temps = days.map((d) => d.bbt).filter((t): t is number => t !== undefined);
  const lo = temps.length ? Math.floor((Math.min(...temps) - 0.1) * 10) / 10 : 36;
  const hi = temps.length ? Math.ceil((Math.max(...temps) + 0.1) * 10) / 10 : 37;
  const slot = innerW / Math.max(days.length, 1);
  const x = (i: number) => W - pad.axis - slot * i - slot / 2;
  const y = (t: number) => pad.top + innerH - ((t - lo) / (hi - lo || 1)) * innerH;
  const tempPts = days
    .map((d, i) => (d.bbt !== undefined ? `${x(i)},${y(d.bbt)}` : null))
    .filter(Boolean);
  const rowY = H - pad.bottom + 18;

  return (
    <figure aria-labelledby={titleId}>
      <figcaption id={titleId} className="mb-2 text-sm font-semibold text-ink">
        {title}
      </figcaption>
      <div className="relative">
        <svg
          direction="ltr"
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label={`${title}: ${days.length} ימים`}
        >
          {/* fertile window band */}
          {days.map((d, i) =>
            d.fertile ? (
              <rect
                key={`f${i}`}
                x={x(i) - slot / 2}
                y={pad.top}
                width={slot + 0.5}
                height={innerH}
                fill="color-mix(in oklab, var(--ev-fertile) 12%, transparent)"
              />
            ) : null,
          )}
          {[lo, (lo + hi) / 2, hi].map((t) => (
            <g key={t}>
              <line x1={pad.side} x2={W - pad.axis} y1={y(t)} y2={y(t)} stroke="var(--tk-line)" />
              <text x={W - pad.axis + 6} y={y(t) + 4} fontSize="13" fill="var(--tk-ink-faint)">
                {t.toFixed(1)}°
              </text>
            </g>
          ))}
          {/* ovulation marker */}
          {days.map((d, i) =>
            d.ovulation ? (
              <g key={`o${i}`}>
                <line
                  x1={x(i)}
                  x2={x(i)}
                  y1={pad.top}
                  y2={pad.top + innerH}
                  stroke="var(--ev-ovulation)"
                  strokeWidth="1.5"
                  strokeDasharray="3 4"
                />
                <rect
                  x={x(i) - 5}
                  y={pad.top - 12}
                  width="10"
                  height="10"
                  transform={`rotate(45 ${x(i)} ${pad.top - 7})`}
                  fill="var(--ev-ovulation)"
                />
              </g>
            ) : null,
          )}
          {tempPts.length > 1 ? (
            <polyline
              points={tempPts.join(' ')}
              fill="none"
              stroke="var(--tk-plum)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          ) : null}
          {days.map((d, i) =>
            d.bbt !== undefined ? (
              <circle
                key={`t${i}`}
                cx={x(i)}
                cy={y(d.bbt)}
                r="4"
                fill="var(--tk-plum)"
                stroke="var(--tk-surface)"
                strokeWidth="2"
              />
            ) : null,
          )}
          {/* bottom rows: bleeding and LH */}
          {days.map((d, i) => (
            <g key={`r${i}`}>
              {d.bleed ? (
                <rect
                  x={x(i) - slot * 0.35}
                  y={rowY - 5}
                  width={slot * 0.7}
                  height="8"
                  rx="4"
                  fill="var(--ev-bleed)"
                />
              ) : null}
              {d.lh ? (
                <text
                  x={x(i)}
                  y={rowY + 22}
                  fontSize="13"
                  fontWeight="600"
                  textAnchor="middle"
                  fill={d.lh === 'positive' ? 'var(--ev-ovulation)' : 'var(--tk-ink-faint)'}
                >
                  {d.lh === 'positive' ? '+' : '−'}
                </text>
              ) : null}
              {i % 7 === 0 || i === days.length - 1 ? (
                <text
                  x={x(i)}
                  y={H - 4}
                  fontSize="13"
                  textAnchor="middle"
                  fill="var(--tk-ink-faint)"
                >
                  {d.cycleDay}
                </text>
              ) : null}
            </g>
          ))}
          <text
            x={pad.side - 4}
            y={rowY + 3}
            fontSize="13"
            textAnchor="end"
            fill="var(--tk-ink-faint)"
          >
            דימום
          </text>
          <text
            x={pad.side - 4}
            y={rowY + 20}
            fontSize="13"
            textAnchor="end"
            fill="var(--tk-ink-faint)"
          >
            LH
          </text>
          {/* hit targets + crosshair */}
          {hover !== null ? (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={pad.top}
              y2={rowY + 28}
              stroke="var(--tk-ink-faint)"
              strokeWidth="1"
            />
          ) : null}
          {days.map((d, i) => (
            <rect
              key={`h${i}`}
              x={x(i) - slot / 2}
              y={0}
              width={slot}
              height={H}
              fill="transparent"
              tabIndex={0}
              aria-label={`יום ${d.cycleDay}`}
              className="outline-none"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
            />
          ))}
        </svg>
        {hover !== null && days[hover] ? (
          <Tooltip x={x(hover)} yPct={30} width={W}>
            <strong className="font-semibold">יום {days[hover].cycleDay}</strong>
            <span className="ms-2 opacity-80">{days[hover].label}</span>
            <div className="mt-0.5 opacity-90">
              {[
                days[hover].bbt !== undefined ? `חום ${days[hover].bbt}°` : '',
                days[hover].lh ? `LH ${days[hover].lh === 'positive' ? 'חיובית' : 'שלילית'}` : '',
                days[hover].bleed ? 'דימום' : '',
                days[hover].ovulation
                  ? 'ביוץ משוער'
                  : days[hover].fertile
                    ? 'חלון פוריות משוער'
                    : '',
              ]
                .filter(Boolean)
                .join(' · ') || 'אין תיעוד'}
            </div>
          </Tooltip>
        ) : null}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.75rem] text-ink-soft">
        <li className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-plum" />
          חום גוף בסיסי
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="h-3 w-4 rounded-sm"
            style={{ background: 'color-mix(in oklab, var(--ev-fertile) 18%, transparent)' }}
          />
          חלון פוריות משוער
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2 rotate-45" style={{ background: 'var(--ev-ovulation)' }} />
          ביוץ משוער
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full" style={{ background: 'var(--ev-bleed)' }} />
          דימום
        </li>
        <li className="flex items-center gap-1.5">
          <span className="font-semibold">+ / −</span>בדיקת ביוץ
        </li>
      </ul>
      <ChartTable
        caption={title}
        head={['יום', 'תאריך', 'חום', 'LH', 'הערכה']}
        rows={days
          .filter((d) => d.bbt !== undefined || d.lh || d.bleed || d.fertile)
          .map((d) => [
            d.cycleDay,
            d.label,
            d.bbt ?? '—',
            d.lh ? (d.lh === 'positive' ? 'חיובית' : 'שלילית') : '—',
            d.ovulation ? 'ביוץ' : d.fertile ? 'חלון' : '—',
          ])}
      />
    </figure>
  );
}
