# ארכיטקטורה – TAHARA

> סטטוס: שלב 1 (שלד) + שלב א (עיצוב מלא וסימולציה – ראו `stage-a-design.md`). מסמך זה מתאר גם רכיבים מתוכננים.

## עקרונות

1. **פרטיות כברירת מחדל** – כל משתמשת רואה רק את נתוניה; מנהלת המערכת אינה רואה תוכן אישי, רפואי או הלכתי.
2. **הפרדה בין רפואה להלכה** – שני מנועים ושני schemas נפרדים, ללא תלות הדדית.
3. **אכיפה בכל שכבה** – Proxy (חוויית משתמש בלבד) → שרת → RLS → אילוצי DB.
4. **שום דבר לא מוצג כפעיל לפני שהוא פעיל** – רשימות הפיצ'רים (`apps/web/src/config/features.ts`, `apps/admin/src/config/modules.ts`) נבדקות בטסטים.
5. **מובייל תחילה, עברית ו-RTL מלאים**, אזור זמן `Asia/Jerusalem`.

## מבנה המונו־רפו

| נתיב                               | תפקיד                                                          | שלב                         |
| ---------------------------------- | -------------------------------------------------------------- | --------------------------- |
| `apps/web`                         | אפליקציית המשתמשות + אתר שיווקי (Next.js App Router)           | 1 ✓ (שלד)                   |
| `apps/admin`                       | מערכת ניהול נפרדת – פריסה, דומיין ומשתני סביבה נפרדים          | 1 ✓ (שלד, נעול כברירת מחדל) |
| `packages/ui`                      | מערכת עיצוב: טוקנים, רכיבים, RTL                               | 1 ✓                         |
| `packages/security`                | CSP עם nonce, כותרות אבטחה, קבועי מטמון                        | 1 ✓                         |
| `packages/config`                  | tsconfig בסיסי                                                 | 1 ✓                         |
| `packages/core/calendar`           | PlainDate, אזור זמן, תאריך עברי, זריחה/שקיעה                   | 3                           |
| `packages/core/medical-engine`     | מחזורים, ממוצעים, ביוץ, חלון פוריות                            | 4                           |
| `packages/core/src/halacha-engine` | וסתות/עונות, הפסק, שבעה נקיים, טבילה – מאחורי registry אישורים | 5                           |
| `packages/legacy-import`           | פענוח ואימות גיבוי האב־טיפוס                                   | 8                           |
| `packages/db`                      | טיפוסי Supabase וגישה לנתונים                                  | 2                           |
| `supabase/`                        | migrations, RLS, בדיקות pgTAP                                  | 2                           |

## גבולות (נאכפים ב-ESLint ונבדקים ב-`scripts/eslint-boundaries.test.mjs`)

- `medical-engine` ↮ `halacha-engine` – אסור ייבוא הדדי.
- `apps/admin` – אסור לייבא מנועים או features של מחזור/הלכה.
- אסור `localStorage` / `sessionStorage` / `indexedDB` – אין נתונים אישיים באחסון הדפדפן.
- אסור `navigator.geolocation` – בחירת עיר במקום GPS.

## אירוח

- **GitHub** – ניהול קוד בלבד. המוצר המסחרי **אינו** מתארח ב-GitHub Pages.
- **Vercel** – שני פרויקטים נפרדים: `tahara-web` (Root: `apps/web`) ו-`tahara-admin` (Root: `apps/admin`), כל אחד עם משתני סביבה משלו. ראו `deployment-vercel.md`.
- **Supabase** (שלב 2) – Postgres + Auth, אזור אירופה; פרויקט dev ופרויקט prod נפרדים.

## אבטחת תגובות HTTP (פעיל משלב 1)

- CSP עם nonce ייחודי לכל בקשה ו-`strict-dynamic`; ללא `unsafe-eval` בייצור; `frame-ancestors 'none'`.
- HSTS, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy` (כולל `geolocation=()`).
- כל נתיבי האזור האישי ו-`/login`: `Cache-Control: private, no-store`.
- מערכת הניהול: `X-Robots-Tag: noindex` ו-`no-store` בכל תגובה; מחזירה 404 כל עוד `ADMIN_PREVIEW_ENABLED` אינו `true`.

## PWA ומטמון

ראו `privacy-and-data.md` §8. בקצרה: ה-Service Worker שומר רק קבצי build סטטיים, אייקונים ודף אופליין סטטי; אינו שומר דפים, RSC, API או בקשות חוצות־מקור. נבדק ביחידה ו-E2E.

## מיקום

חישובי זריחה/שקיעה יתבססו על **עיר שהמשתמשת בוחרת מרשימה** (קואורדינטות של מרכז העיר). המערכת לא מבקשת הרשאת מיקום, וה-Permissions-Policy חוסם אותה.
