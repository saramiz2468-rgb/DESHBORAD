# תוכנית בדיקות

## פקודות

| פקודה                               | מה רץ                                                 |
| ----------------------------------- | ----------------------------------------------------- |
| `npm run verify:prototype`          | האב־טיפוס ושאר הפרויקטים ב-repo לא שונו (SHA-256)     |
| `npm run lint`                      | ESLint (0 אזהרות), כולל גבולות ארכיטקטורה             |
| `npm run typecheck`                 | `tsc` לכל החבילות והאפליקציות (strict)                |
| `npm test`                          | Vitest – יחידה                                        |
| `npm run build && npm run test:e2e` | Playwright מול build ייצור (mobile Pixel 7 + desktop) |
| `npm run check`                     | verify + lint + typecheck + test                      |

## מה נבדק בשלב 1

**יחידה (Vitest)**

- `packages/security` – CSP: nonce חובה, ללא `unsafe-eval` בייצור, אימות origins, nonce ייחודי; Permissions-Policy חוסם geolocation.
- `apps/web` – כל המסכים מסומנים `planned`; ניווט מובייל ≤ 5; הלכה דורשת אישור גורם מוסמך; ללא GPS; סיווג נתיבים פרטיים; **מדיניות Service Worker** (מה נשמר ומה לעולם לא).
- `apps/admin` – כל המודולים `planned`; כל התחומים העסקיים קיימים; **אין שדות תוכן רפואי/הלכתי**; אין תפוגה לזכאות; נעילת preview.
- `scripts` – אי־שינוי האב־טיפוס; כללי ESLint אכן חוסמים ייבוא בין מנועים, ייבוא מנועים ב-admin, localStorage ו-geolocation.

**E2E (Playwright, מובייל + דסקטופ)**

- כל מסך: `lang=he`, `dir=rtl`, ללא גלילה אופקית.
- מסכים מתוכננים: באנר "תצוגת מבנה", תג "מתוכנן", **אין שדות קלט**.
- כניסה ורכישה מושבתות.
- כותרות: CSP עם nonce משתנה, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, ללא X-Powered-By; `no-store` בנתיבים פרטיים וב-`/sw.js`.
- אין שגיאות קונסול/הפרות CSP; ניווט צד־לקוח עובד (הוכחה שה-hydration רץ עם ה-nonce).
- **PWA**: אחרי גלישה באזור האישי – המטמון מכיל רק קבצים סטטיים מותרים; localStorage, sessionStorage ו-IndexedDB ריקים; אופליין → דף אופליין סטטי ולא דף פרטי שמור.
- **Admin**: נעול (404 + noindex + no-store) כברירת מחדל; ב-preview – כל המודולים, ללא נתונים, ללא מספרים בלוח הבקרה, גבול הפרטיות מוצג.

## מתוכנן לשלבים הבאים

- שלב 2: pgTAP ל-RLS והפרדת מנהלת; טסטים ל-authz בשרת; טסט סטטי נגד תפוגת זכאות.
- שלב 3: מטריצת בדיקות הקצה של התאריכים (`halacha-rules-governance.md`).
- שלב 5: מקרי בדיקה מאושרים לכל כלל הלכתי.
- שלב 8: fixtures לייבוא.
- שלב 10: נגישות אוטומטית (axe) + בדיקה ידנית לפי ת"י 5568.
