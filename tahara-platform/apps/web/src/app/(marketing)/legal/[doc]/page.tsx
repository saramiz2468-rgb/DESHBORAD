import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Card, Notice, PageHeader, StatusBadge } from '@tahara/ui';

const DOCS = {
  terms: {
    title: 'תנאי שימוש',
    body: 'תנאי השימוש יכללו את מודל הרכישה החד־פעמית והגישה לכל החיים, וכן את מדיניות ההחזרים.',
  },
  privacy: {
    title: 'מדיניות פרטיות',
    body: 'מדיניות הפרטיות תפרט אילו נתונים נאספים, למה, כמה זמן הם נשמרים, ואיך מייצאים ומוחקים אותם.',
  },
  accessibility: {
    title: 'הצהרת נגישות',
    body: 'הצהרת הנגישות תפורסם אחרי בדיקת התאמה לתקן הישראלי 5568 (WCAG 2.1 ברמה AA).',
  },
} as const;

type DocKey = keyof typeof DOCS;
const isDoc = (k: string): k is DocKey => k in DOCS;

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: PageProps<'/legal/[doc]'>): Promise<Metadata> {
  const { doc } = await params;
  return { title: isDoc(doc) ? DOCS[doc].title : 'מסמך' };
}

export default async function LegalPage({ params }: PageProps<'/legal/[doc]'>) {
  const { doc } = await params;
  if (!isDoc(doc)) notFound();
  const d = DOCS[doc];
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="מסמכים"
        title={d.title}
        aside={<StatusBadge status="in-development" />}
      />
      <Card>
        <p className="leading-relaxed text-ink-soft">{d.body}</p>
        <Notice className="mt-5" title="המסמך עדיין בהכנה">
          הנוסח המחייב יפורסם כאן אחרי בדיקה משפטית, לפני פתיחת הרכישה.
        </Notice>
      </Card>
    </div>
  );
}
