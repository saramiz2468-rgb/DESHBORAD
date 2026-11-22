# ייבוא נתונים מהאב־טיפוס (`tahara/`)

> סטטוס: תכנון לשלב 8. **האב־טיפוס אינו משתנה** – נאכף ב-`scripts/verify-prototype.mjs` (hash SHA-256 לכל קובץ) שרץ ב-`npm run check`.

## פורמט הקובץ (נגזר מקוד האב־טיפוס, `tahara/app.js`)

```jsonc
// tahara-backup-YYYY-MM-DD.json
{ "app": "TAHARA", "encrypted": false, "data": { /* state */ } }
{ "app": "TAHARA", "encrypted": true,  "data": { "salt": "<b64>", "iv": "<b64>", "ct": "<b64>" } }
// מוצפן: AES-256-GCM, מפתח PBKDF2-SHA256, 250,000 סבבים, מתוך קוד ה-PIN האישי.
```

`state` (גרסה `v: 1`): `settings`, `periods[]` (id, start, end, time, onahMode, bleedDays, flow, symptoms, notes, tahara: { hefsek, days, tevila }), `ovLogs[]` (id, date, lh, bbt, mucus, pain, symptoms, notes), `onboarded`, `notified`, `pinEnabled`.

## תהליך

1. **בחירת קובץ** – בדפדפן בלבד. הקובץ אינו מועלה לשרת כפי שהוא.
2. **פענוח** (אם מוצפן) – הקלדת PIN, פענוח ב-Web Crypto במכשיר. ה-PIN לעולם לא נשלח. PIN שגוי → הודעה, ללא נעילה בשרת.
3. **אימות** – סכמת zod קפדנית (`packages/legacy-import`):
   - `app === 'TAHARA'`, `v === 1` (גרסה לא מוכרת → עצירה עם הסבר).
   - תאריכים `YYYY-MM-DD` תקינים, לא עתידיים; `end >= start`; `bleedDays` 1–20; `bbt` 34–40; מחרוזות עד אורך מרבי; enum ל-`onahMode`, `lh`.
   - כפילויות (אותו `start`) וחפיפות.
4. **דוח מקדים** – X מחזורים תקינים, Y תיעודי ביוץ, Z נדחו (עם סיבה לכל אחד), W כפולים מול נתונים קיימים בענן. **אין כתיבה לפני אישור.**
5. **גיבוי לפני כתיבה** – הורדה אוטומטית של ייצוא JSON של הנתונים הקיימים בענן.
6. **כתיבה אטומית** – RPC אחד (`app.import_legacy(batch jsonb)`) בטרנזקציה אחת; עובר `requireEntitlement` + RLS; כל רשומה מקבלת `import_batch_id`.
7. **ביטול ייבוא** – מחיקת כל הרשומות של `import_batch_id` (זמין מההגדרות).
8. **תיעוד** – `audit_log`: ייבוא בוצע/בוטל, מספר רשומות (ללא תוכן).

## מיפוי

| אב־טיפוס                                                 | יעד                                                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `periods[].start/end/time/bleedDays/flow/symptoms/notes` | `med.periods`                                                                              |
| `ovLogs[]`                                               | `med.daily_logs`                                                                           |
| `periods[].start/time/onahMode`                          | `hal.vestot`                                                                               |
| `periods[].tahara.hefsek` / `.days` / `.tevila`          | `hal.tahara_cycles` / `hal.bedikot` / `hal.tevila`                                         |
| `settings.onot.*`                                        | נשמר כ**הצעה** בהגדרות המנהג; **לא מפעיל** כללים שלא אושרו (`halacha-rules-governance.md`) |
| `settings.lat/lng`                                       | מוצע כעיר הקרובה מרשימת הערים; המשתמשת מאשרת                                               |
| `notified`, `pinEnabled`, `onboarded`                    | לא מיובא                                                                                   |

## בדיקות (קבצי fixture נוצרים בטסטים בלבד; לא מוצגים באפליקציה)

תקין לא מוצפן · מוצפן + PIN נכון · PIN שגוי · JSON פגום · `app` שגוי · גרסה לא מוכרת · תאריך עתידי · end<start · כפילויות · שדות חסרים · קובץ ענק (מגבלת גודל) · ייבוא כפול של אותו קובץ · ביטול ייבוא.
