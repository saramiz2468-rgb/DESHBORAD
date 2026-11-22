import type { Metadata } from 'next';
import { PageHeader, PlannedFeature, StatusBadge } from '@tahara/ui';

export const metadata: Metadata = { title: 'תמיכה' };

export default function Page() {
  return (
    <div>
      <PageHeader
        title="תמיכה"
        description="פנייה לצוות בנושאי חשבון ורכישה."
        aside={<StatusBadge status="planned" />}
      />
      <PlannedFeature
        title="פניות"
        summary="צוות התמיכה רואה רק את מה שתכתבי בפנייה. אין לו גישה למעקב האישי שלך."
        items={['פתיחת פנייה ומעקב אחר הסטטוס', 'מומלץ לא לכלול מידע רפואי בפנייה']}
        stage="יתווסף יחד עם החשבון האישי ומערכת הניהול"
      />
    </div>
  );
}
