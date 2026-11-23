'use client';

import { useState } from 'react';
import { Button, Card, Notice } from '@tahara/ui';
import { CITIES, cityById, formatMinutes, sunTimes } from '@tahara/core/calendar';
import {
  MINHAG_LABELS,
  MINHAG_PRESETS,
  type FixedVeset,
  type MinhagKey,
  type Onah,
} from '@tahara/core/halacha-engine';
import { SectionTitle } from '@/components/app/bits';
import { Field, Segmented, Switch, TextInput } from '@/components/app/fields';
import { useTahara } from '@/state/store';

const MINHAGIM: ReadonlyArray<{ value: MinhagKey; label: string }> = (
  ['sephardi', 'ashkenazi', 'personal'] as const
).map((v) => ({ value: v, label: MINHAG_LABELS[v] }));

export function CitySetting() {
  const { data, today, setHalacha, notify } = useTahara();
  const city = cityById(data.halacha.cityId);
  const sun = sunTimes(today, city.lat, city.lng);
  return (
    <div className="space-y-2">
      <Field
        label="עיר לחישוב זריחה ושקיעה"
        hint="בחירה מרשימה, בלי מיקום GPS. החישוב לפי גובה פני הים."
      >
        {(p) => (
          <select
            {...p}
            value={city.id}
            onChange={(e) => {
              setHalacha({ cityId: e.target.value });
              notify(`העיר עודכנה ל${cityById(e.target.value).name}`);
            }}
            className="block min-h-12 w-full rounded-2xl border border-line bg-surface px-4 text-[0.95rem] text-ink"
          >
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </Field>
      <p className="rounded-xl bg-surface-muted px-3 py-2 text-sm text-ink-soft">
        היום ב{city.name}: זריחה <strong className="text-ink">{formatMinutes(sun.sunrise)}</strong>{' '}
        · שקיעה <strong className="text-ink">{formatMinutes(sun.sunset)}</strong>
      </p>
      <p className="text-xs text-ink-faint">
        זמנים מחושבים עשויים להיות שונים בכמה דקות מלוחות מקומיים. בשעות הסמוכות לזריחה או לשקיעה יש
        לברר עם רב.
      </p>
    </div>
  );
}

export function HalachaSettingsSection() {
  const { data, setHalacha, notify } = useTahara();
  const h = data.halacha;
  const [fixedOn, setFixedOn] = useState(!!h.fixedVeset);
  const [fixed, setFixed] = useState<{
    type: FixedVeset['type'];
    value: string;
    onah: Onah;
    confirmedBy: string;
  }>({
    type: h.fixedVeset?.type ?? 'haflagah',
    value: h.fixedVeset ? String(h.fixedVeset.value) : '',
    onah: h.fixedVeset?.onah ?? 'day',
    confirmedBy: h.fixedVeset?.confirmedBy ?? '',
  });
  const [fixedErr, setFixedErr] = useState<string>();

  function chooseMinhag(m: MinhagKey) {
    if (m === 'personal') setHalacha({ minhag: m, configured: true });
    else setHalacha({ minhag: m, configured: true, ...MINHAG_PRESETS[m].values });
    notify('המנהג נשמר. המועדים חושבו מחדש');
  }

  function saveFixed() {
    const v = Number(fixed.value);
    const max = fixed.type === 'chodesh' ? 30 : 90;
    if (!Number.isInteger(v) || v < 1 || v > max)
      return setFixedErr(
        fixed.type === 'chodesh' ? 'יום בחודש בין 1 ל-30' : 'מספר ימים בין 1 ל-90',
      );
    if (!fixed.confirmedBy.trim()) return setFixedErr('יש לציין מי הרב שקבע את הווסת');
    setFixedErr(undefined);
    setHalacha({
      fixedVeset: {
        type: fixed.type,
        value: v,
        onah: fixed.onah,
        confirmedBy: fixed.confirmedBy.trim(),
      },
    });
    notify('הוראת הרב נשמרה. המועדים חושבו מחדש');
  }

  return (
    <section id="halacha" className="scroll-mt-20">
      <SectionTitle>המנהג ההלכתי שלי</SectionTitle>
      <Card className="space-y-5">
        <Segmented
          label="מנהג"
          value={h.configured ? h.minhag : undefined}
          options={MINHAGIM}
          onChange={(v) => v && chooseMinhag(v)}
        />
        {!h.configured ? (
          <p className="text-sm text-ink-soft">
            בחרי מנהג כדי שיחושבו ימי פרישה. אפשר לשנות כל הגדרה בנפרד לפי הוראת רב.
          </p>
        ) : null}
        {h.configured && h.minhag !== 'personal' ? (
          <Notice title="הגדרות מוצעות, טעונות אימות">
            {MINHAG_PRESETS[h.minhag].note} לא כל בני העדה נוהגים באותה צורה. יש לאשר עם רב, ולשנות
            לפי הצורך.
          </Notice>
        ) : null}
        {h.configured && h.minhag === 'personal' ? (
          <Notice>הגדירי כל אפשרות לפי הוראת הרב שלך.</Notice>
        ) : null}

        {h.configured ? (
          <div className="space-y-4 border-t border-line pt-4">
            <p className="text-sm font-medium text-ink">הגדרות פרטניות</p>
            <Switch
              label="עונה בינונית מעת לעת"
              description="פרישה בשתי העונות של היום ה-30"
              checked={h.beinonitFullDay}
              onChange={(v) => setHalacha({ beinonitFullDay: v })}
            />
            <Switch
              label="עונה בינונית גם ביום 31"
              checked={h.beinonitDay31}
              onChange={(v) => setHalacha({ beinonitDay31: v })}
            />
            <Switch
              label="חומרת אור זרוע"
              description="פרישה גם בעונה שלפני עונת הווסת"
              checked={h.ohrZarua}
              onChange={(v) => setHalacha({ ohrZarua: v })}
            />
            <Switch
              label="חשש להפלגות שלא נעקרו"
              description="הפלגה ארוכה קודמת שלא עבר עליה מועד בלי ראייה"
              checked={h.haflagotNotUprooted}
              onChange={(v) => setHalacha({ haflagotNotUprooted: v })}
            />
          </div>
        ) : null}

        {h.configured ? (
          <div className="space-y-4 border-t border-line pt-4">
            <Switch
              label="וסת קבוע שנקבע על ידי רב"
              description="הוראה אישית. האפליקציה לא קובעת וסת קבוע בעצמה."
              checked={fixedOn}
              onChange={(v) => {
                setFixedOn(v);
                if (!v && h.fixedVeset) {
                  setHalacha({ fixedVeset: null });
                  notify('הוראת הווסת הקבוע הוסרה');
                }
              }}
            />
            {fixedOn ? (
              <div className="space-y-4">
                <Segmented
                  label="סוג הווסת"
                  value={fixed.type}
                  options={[
                    { value: 'haflagah', label: 'וסת הפלגה' },
                    { value: 'chodesh', label: 'וסת החודש' },
                  ]}
                  onChange={(v) => v && setFixed({ ...fixed, type: v })}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={fixed.type === 'chodesh' ? 'יום בחודש העברי' : 'מספר ימי ההפלגה'}
                    error={fixedErr}
                  >
                    {(p) => (
                      <TextInput
                        {...p}
                        type="number"
                        inputMode="numeric"
                        dir="ltr"
                        className="text-end"
                        value={fixed.value}
                        onChange={(e) => setFixed({ ...fixed, value: e.target.value })}
                      />
                    )}
                  </Field>
                  <Field label="שם הרב שקבע">
                    {(p) => (
                      <TextInput
                        {...p}
                        maxLength={60}
                        value={fixed.confirmedBy}
                        onChange={(e) => setFixed({ ...fixed, confirmedBy: e.target.value })}
                      />
                    )}
                  </Field>
                </div>
                <Segmented
                  label="עונה"
                  value={fixed.onah}
                  options={[
                    { value: 'day', label: 'עונת יום' },
                    { value: 'night', label: 'עונת לילה' },
                  ]}
                  onChange={(v) => v && setFixed({ ...fixed, onah: v })}
                />
                <Button variant="secondary" onClick={saveFixed}>
                  שמירת הוראת הרב
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="border-t border-line pt-4">
          <CitySetting />
        </div>
      </Card>
    </section>
  );
}
