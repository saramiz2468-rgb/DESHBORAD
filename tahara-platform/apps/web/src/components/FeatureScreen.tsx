import type { ReactNode } from 'react';
import { Notice, PageHeader, PlannedFeature, StatusBadge } from '@tahara/ui';
import { getFeature, type FeatureKey } from '@/config/features';

/** Renders a planned (not yet active) screen from the feature registry. */
export function FeatureScreen({ feature, notice }: { feature: FeatureKey; notice?: ReactNode }) {
  const f = getFeature(feature);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={f.title}
        description={f.description}
        aside={<StatusBadge status={f.status} />}
      />
      {notice ? <div className="mb-5">{notice}</div> : null}
      <div className="grid gap-4">
        {f.sections.map((s) => (
          <PlannedFeature
            key={s.title}
            title={s.title}
            summary={s.summary}
            items={s.items}
            stage={f.stage}
          />
        ))}
      </div>
    </div>
  );
}

export const halachaNotice = (
  <Notice tone="caution" title="החישובים ההלכתיים עדיין לא פעילים">
    הם יופעלו רק אחרי שגורם הלכתי מוסמך יבדוק ויאשר כל כלל. גם אז הם יהיו כלי עזר בלבד ולא פסק הלכה.
    בכל שאלה יש להתייעץ עם רב.
  </Notice>
);

export const medicalNotice = (
  <Notice title="הערכה בלבד">
    תחזיות של מחזור, ביוץ ופוריות הן הערכה סטטיסטית בלבד. הן לא מחליפות ייעוץ רפואי ולא מתאימות
    לשימוש כאמצעי מניעה.
  </Notice>
);
