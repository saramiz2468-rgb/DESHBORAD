import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Card, Notice, PageHeader, StatusBadge } from '@tahara/ui';
import { ADMIN_MODULES, type AdminModule } from '@/config/modules';

const find = (key: string): AdminModule | undefined =>
  ADMIN_MODULES.find((m) => m.href === `/${key}`);

export function generateStaticParams() {
  return ADMIN_MODULES.map((m) => ({ module: m.key }));
}

export async function generateMetadata({ params }: PageProps<'/[module]'>): Promise<Metadata> {
  const { module } = await params;
  return { title: find(module)?.label ?? 'ניהול' };
}

export default async function ModulePage({ params }: PageProps<'/[module]'>) {
  const { module } = await params;
  const m = find(module);
  if (!m) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="מערכת ניהול"
        title={m.label}
        description={m.description}
        aside={<StatusBadge status={m.status} />}
      />

      {m.key === 'dashboard' ? (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {m.fields.map((f) => (
            <Card key={f} className="p-4 sm:p-5">
              <p className="text-xs leading-snug text-ink-soft">{f}</p>
              <p
                className="mt-3 font-display font-black tracking-tight text-3xl text-ink-faint"
                aria-label="אין נתונים"
              >
                —
              </p>
              <p className="mt-1 text-[0.7rem] text-ink-faint">לא חובר מקור נתונים</p>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mb-6 overflow-hidden p-0 sm:p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="bg-surface-muted text-ink-soft">
                <tr>
                  {m.fields.map((f) => (
                    <th
                      key={f}
                      scope="col"
                      className="px-4 py-3 text-start font-medium whitespace-nowrap"
                    >
                      {f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={m.fields.length} className="px-4 py-14 text-center text-ink-faint">
                    אין נתונים להצגה. המודול יחובר לבסיס הנתונים בשלב 7.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {m.actions.length ? (
          <Card>
            <h2 className="mb-3 font-semibold text-ink">פעולות מתוכננות</h2>
            <ul className="space-y-2 text-sm text-ink-soft">
              {m.actions.map((a) => (
                <li key={a} className="flex gap-2.5">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rotate-45 bg-rose-soft" />
                  {a}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
        <Notice title="גבול הפרטיות">
          למערכת הניהול אין גישה לתוכן האישי, הרפואי או ההלכתי של המשתמשות. ההגבלה נאכפת בבסיס
          הנתונים עצמו, לא רק בממשק.
        </Notice>
      </div>
    </div>
  );
}
