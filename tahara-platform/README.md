# TAHARA Platform

מוצר מסחרי: אפליקציית Web (PWA) בעברית וב-RTL למעקב אישי אחר מחזור, טהרת המשפחה, ביוץ ופוריות.

> **סטטוס: שלב 1 – שלד.** אין חיבור ל-Supabase, אין תשלום, אין חישובים הלכתיים או רפואיים. כל מסך מסומן "מתוכנן".
> האב־טיפוס המקורי נמצא ב-`../tahara/` ואינו משתנה (נאכף ב-`npm run verify:prototype`).

## מבנה

```
apps/web        אפליקציית המשתמשות + אתר שיווקי          → Vercel: tahara-web
apps/admin      מערכת ניהול נפרדת (נעולה כברירת מחדל)     → Vercel: tahara-admin
packages/ui     מערכת עיצוב (טוקנים, רכיבים, RTL)
packages/security  CSP עם nonce, כותרות אבטחה
packages/config tsconfig בסיסי
docs/           ארכיטקטורה, הרשאות, פרטיות, זכאות, ייבוא, הלכה, בדיקות, פריסה
scripts/        בדיקת אי־שינוי האב־טיפוס, יצירת אייקונים
tests/e2e/      Playwright
```

## הפעלה מקומית

דרישות: Node.js 22 (`.nvmrc`), npm 10.

```bash
cd tahara-platform
npm install
npm run dev:web                                   # http://localhost:3000
ADMIN_PREVIEW_ENABLED=true npm run dev:admin      # http://localhost:3001  (בלי המשתנה: 404)
```

בדיקות:

```bash
npm run check          # אי־שינוי אב־טיפוס + lint + typecheck + יחידה
npm run build          # build ייצור לשתי האפליקציות
npm run test:e2e       # Playwright מול ה-build (מפעיל שרתים על 3000/3001/3002)
```

ה-Service Worker נרשם רק ב-build ייצור (`npm run build && npm run start -w @tahara/web`), או ב-dev עם `NEXT_PUBLIC_ENABLE_SW_IN_DEV=true`.

## מסמכים

- [ארכיטקטורה](docs/architecture.md)
- [מודל הרשאות](docs/authorization.md)
- [פרטיות ונתונים](docs/privacy-and-data.md)
- [גישה לכל החיים](docs/lifetime-access.md)
- [זכאויות והחזרים](docs/entitlements-and-refunds.md)
- [הצפנה בצד הלקוח – תכנון](docs/client-side-encryption.md)
- [ייבוא מהאב־טיפוס](docs/legacy-import.md)
- [ניהול כללים הלכתיים](docs/halacha-rules-governance.md)
- [תוכנית בדיקות](docs/test-plan.md)
- [פריסה ל-Vercel](docs/deployment-vercel.md)

> TAHARA היא כלי עזר למעקב אישי. היא אינה ייעוץ רפואי ואינה פסק הלכה.
