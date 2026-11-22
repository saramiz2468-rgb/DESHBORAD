# פריסה ל-Vercel

> GitHub משמש לניהול הקוד בלבד. המוצר **אינו** נפרס ל-GitHub Pages.

## שני פרויקטים נפרדים

|                                            | `tahara-web`                                       | `tahara-admin`                                                      |
| ------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------- |
| Root Directory                             | `tahara-platform/apps/web`                         | `tahara-platform/apps/admin`                                        |
| Framework                                  | Next.js (זיהוי אוטומטי)                            | Next.js                                                             |
| Install Command                            | `cd ../.. && npm ci` (מתקין מתוך שורש ה-workspace) | `cd ../.. && npm ci`                                                |
| Build Command                              | `next build` (ברירת מחדל)                          | `next build`                                                        |
| Node.js                                    | 22.x                                               | 22.x                                                                |
| "Include files outside the Root Directory" | **מופעל** (נדרש ל-`packages/*`)                    | **מופעל**                                                           |
| דומיין (דוגמה)                             | `tahara.co.il` / `app.tahara.co.il`                | `admin.<domain>` – דומיין נפרד                                      |
| Deployment Protection                      | לפי הצורך                                          | **Vercel Authentication על Preview ו-Production** (שכבת הגנה נוספת) |

> שורש ה-npm workspace הוא `tahara-platform/` (לא שורש ה-repo), ולכן פקודת ההתקנה מוגדרת במפורש. אם `tahara-platform` יועבר ל-repo משלו, Root Directory יהיה `apps/web` / `apps/admin` וההתקנה תזוהה אוטומטית.

## שלבים

1. Vercel → Add New → Project → בחירת ה-repo מ-GitHub.
2. Root Directory: `tahara-platform/apps/web` (פקודת ההתקנה כבר מוגדרת ב-`apps/web/vercel.json`). לוודא ש-"Include source files outside of the Root Directory" מסומן. Deploy.
3. שוב Add New → Project → אותו repo, Root Directory: `tahara-platform/apps/admin` (מוגדר ב-`apps/admin/vercel.json`). Deploy.
4. בכל פרויקט → Settings → Environment Variables – **רק** המשתנים של אותה אפליקציה (ראו `.env.example` בכל אפליקציה), בנפרד ל-Production / Preview / Development.
5. Settings → Git → Ignored Build Step (מומלץ, כדי שכל פרויקט ייבנה רק כשהוא או החבילות המשותפות השתנו):
   - web: `git diff --quiet HEAD^ HEAD -- ../../apps/web ../../packages ../../package-lock.json`
   - admin: `git diff --quiet HEAD^ HEAD -- ../../apps/admin ../../packages ../../package-lock.json`

## משתני סביבה – שלב 1

| פרויקט | משתנה                   | Production                 | Preview                |
| ------ | ----------------------- | -------------------------- | ---------------------- |
| web    | `NEXT_PUBLIC_SITE_URL`  | כתובת הדומיין              | אופציונלי              |
| admin  | `ADMIN_PREVIEW_ENABLED` | **לא להגדיר** (נעול – 404) | `true` רק לסקירת עיצוב |

משתנים עתידיים (Supabase, ספק תשלום) **לא יוגדרו** עד השלבים הרלוונטיים. `SUPABASE_SERVICE_ROLE_KEY` יוגדר בעתיד **רק** ב-`tahara-web` (Production, לשימוש ה-webhook) ולעולם לא ב-`tahara-admin`.

## בדיקה אחרי פריסה

```bash
curl -sI https://<web-domain>/today | grep -iE 'content-security-policy|cache-control|strict-transport'
curl -sI https://<admin-domain>/dashboard   # צפוי: 404 ו-X-Robots-Tag: noindex (כל עוד לא הוגדר preview)
```
