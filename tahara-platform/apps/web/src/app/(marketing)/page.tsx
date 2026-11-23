import Link from 'next/link';
import { Button, Card, StatusBadge, buttonClasses } from '@tahara/ui';

const principles = [
  {
    title: 'פרטיות בכל שכבה',
    body: 'כל משתמשת רואה רק את הנתונים שלה. גם צוות השירות לא יכול לגשת לתוכן האישי, הרפואי או ההלכתי.',
  },
  {
    title: 'רפואה והלכה בנפרד',
    body: 'המעקב הרפואי והמעקב ההלכתי הם שני מנועים נפרדים. אף אחד מהם לא מסיק דבר מהשני.',
  },
  {
    title: 'עברי ולועזי, שעון ירושלים',
    body: 'כל תאריך מוצג בלוח העברי, בלועזי או בשניהם. החישובים מתבססים על אזור הזמן של ירושלים ועל העיר שתבחרי.',
  },
  {
    title: 'כניסה בלי סיסמה',
    body: 'כניסה בקישור אישי ומאובטח שנשלח למייל. אין סיסמה לזכור, ואין סיסמה שיכולה לדלוף.',
  },
  {
    title: 'רכישה אחת, לכל החיים',
    body: 'תשלום חד־פעמי בלי מנוי ובלי חידושים. הגישה לא פגה עם הזמן, לפי תנאי השירות.',
  },
  {
    title: 'בדיקה הלכתית לפני השקה',
    body: 'אף חישוב הלכתי לא יופעל לפני שגורם הלכתי מוסמך יבדוק ויאשר אותו. גם אז הוא כלי עזר בלבד ולא פסק הלכה.',
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 mx-auto size-[36rem] max-w-full rounded-full bg-blush/70 blur-3xl"
        />
        <div className="relative mx-auto max-w-3xl px-4 pt-14 pb-16 text-center sm:px-6 sm:pt-24 sm:pb-24">
          <StatusBadge status="in-development" className="mb-6" />
          <h1 className="font-display font-black tracking-tight text-[2.4rem] leading-[1.15] text-plum sm:text-6xl">
            היומן האישי שלך,
            <br />
            <span className="text-rose">בשקט ובדיוק.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[1.05rem] leading-relaxed text-ink-soft sm:text-lg">
            TAHARA היא אפליקציה בעברית למעקב אישי אחר מחזור, טהרת המשפחה, ביוץ ופוריות. היא נבנית
            מהיסוד סביב פרטיות, דיוק ונוחות.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button disabled aria-describedby="purchase-note" className="w-full sm:w-auto">
              הרכישה תיפתח בקרוב
            </Button>
            <Link href="/today" className={buttonClasses('secondary', 'w-full sm:w-auto')}>
              תצוגה מקדימה של המבנה
            </Link>
          </div>
          <p id="purchase-note" className="mt-4 text-xs text-ink-faint">
            עדיין אין אפשרות לרכוש או להירשם.
          </p>
        </div>
      </section>

      <section id="principles" className="mx-auto max-w-6xl scroll-mt-20 px-4 sm:px-6">
        <div className="mb-8 text-center">
          <p className="text-xs font-medium tracking-wide text-gold">העקרונות שעליהם המוצר נבנה</p>
          <h2 className="mt-2 font-display font-black tracking-tight text-3xl text-plum sm:text-4xl">
            נבנה בזהירות, מהיסוד
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {principles.map((p) => (
            <Card key={p.title}>
              <h3 className="mb-2 text-base font-semibold text-ink">{p.title}</h3>
              <p className="text-sm leading-relaxed text-ink-soft">{p.body}</p>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
