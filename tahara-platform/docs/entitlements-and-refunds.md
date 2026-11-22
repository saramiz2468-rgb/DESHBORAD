# זכאויות, החזרים וביטולים

> סטטוס: תכנון לשלבים 2 (סכמה), 6 (תשלום) ו-7 (ממשק ניהול). אין חיבור לספק תשלום ואין חיוב מדומה.

## מודל נתונים (מתוכנן)

```
commerce.entitlements
  id uuid pk
  user_id uuid not null references auth.users
  product_id uuid not null references commerce.products
  purchase_id uuid null references commerce.purchases   -- null = הענקה ידנית
  status text not null check (status in ('active','suspended','revoked'))
  granted_at timestamptz not null default now()
  granted_by uuid null                                  -- מנהלת, בהענקה ידנית
  -- אין expires_at. בכוונה.

commerce.entitlement_events          -- היסטוריה בלתי ניתנת לשינוי (insert only)
  id, entitlement_id, from_status, to_status,
  reason text check (reason in ('purchase','manual_grant','refund','chargeback',
                                'chargeback_resolved','fraud','tos_violation','admin_correction','restore')),
  actor uuid null, source text ('webhook'|'admin'), note text, created_at
```

## כלל ברזל: אין תפוגה אוטומטית

- אין עמודת תוקף, אין cron, אין trigger ואין בדיקה מבוססת זמן.
- `app.has_active_entitlement(uid)` = `exists(... status = 'active')` – בלי שום השוואת תאריכים.
- טסט סטטי (שלב 2) סורק migrations וקוד ונכשל אם מופיעה השוואת זמן מול זכאות (`expires`, `valid_until`, `now() >` ליד entitlement).
- טסט pgTAP: זכאות שהוענקה "לפני 50 שנה" (granted_at מזויף בבדיקה) עדיין פעילה.

## מעברי סטטוס מותרים

| מ-               | ל-        | מקור                       | סיבה                                                 |
| ---------------- | --------- | -------------------------- | ---------------------------------------------------- |
| —                | active    | webhook רכישה מאומת        | purchase                                             |
| —                | active    | מנהלת (aal2)               | manual_grant + הערה חובה                             |
| active           | suspended | webhook chargeback         | chargeback                                           |
| suspended        | active    | מנהלת / webhook            | chargeback_resolved                                  |
| active/suspended | revoked   | webhook החזר **מלא** מאומת | refund                                               |
| active           | revoked   | מנהלת                      | fraud / tos_violation / admin_correction + הערה חובה |
| revoked          | active    | מנהלת                      | restore + הערה חובה                                  |

כל מעבר: טרנזקציה אחת שמעדכנת `entitlements` ומוסיפה `entitlement_events` + `admin.audit_log`.

## תהליך החזר

1. **בקשה** – פנייה בתמיכה או יוזמת מנהלת → `commerce.refund_requests` (status: requested).
2. **החלטה** – מנהלת מאשרת/דוחה עם סיבה (approved/denied).
3. **ביצוע** – מנהלת מפעילה החזר אצל הספק דרך שרת מאובטח (שלב 6). אין שינוי זכאות בשלב זה.
4. **אישור הספק** – webhook מאומת (חתימה + idempotency) → `purchases.status = refunded`.
5. **ביטול זכאות** – רק בהחזר מלא; החזר חלקי (פיצוי) אינו מבטל.
6. **הודעה** – מייל למשתמשת: ההחזר בוצע, הגישה לכתיבה הופסקה, ייצוא ומחיקה זמינים.

## לאחר ביטול

- כתיבה חסומה (שרת + RLS).
- קריאה, ייצוא ומחיקה – זמינים (תקופה תוגדר בתנאים).
- רכישה מחדש יוצרת זכאות חדשה; הנתונים הקודמים נשמרים אם לא נמחקו.

## קופונים

- `commerce.coupons` – קוד, סוג (אחוז/סכום), ערך, מכסה, `valid_from`/`valid_until`, active.
- **תוקף הקופון משפיע רק על אפשרות המימוש ברכישה – לעולם לא על הזכאות שנוצרה.**
- המימוש נאכף אצל ספק התשלום/בשרת בעת יצירת ה-checkout (שלב 6); הסכום ב-webhook מאומת מול המחיר + הקופון.
