-- מערכת ניהול תיקים · הקמת מסד הנתונים ב-Supabase (גישה עם קוד משרד)
-- להעתיק את כל הקובץ ל-SQL Editor בפרויקט וללחוץ Run. אפשר להריץ שוב בלי נזק.
--
-- הגישה לנתונים מוגנת בקוד משרד סודי: רק דפדפן ששולח את הקוד הנכון יכול לקרוא ולכתוב.
-- במאגר נשמרת רק הגרסה המוצפנת (hash) של הקוד, לא הקוד עצמו.
-- להחלפת הקוד: להריץ שוב את הקובץ עם hash חדש בשורה המסומנת למטה.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.app_kv (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists public.app_kv_history (
  id         bigint generated always as identity primary key,
  key        text not null,
  value      jsonb not null,
  saved_at   timestamptz not null default now(),
  saved_by   text
);

create table if not exists public.app_secret (
  id        int primary key default 1 check (id = 1),
  code_hash text not null
);

-- ↓↓↓ ה-hash של קוד המשרד (SHA-256). מוחלף בקובץ שנשלח אלייך ↓↓↓
insert into public.app_secret (id, code_hash) values (1, '__OFFICE_CODE_SHA256__')
  on conflict (id) do update set code_hash = excluded.code_hash;

-- בדיקה אם הדפדפן שלח את קוד המשרד הנכון (בכותרת x-office-key)
create or replace function public.office_key_ok()
returns boolean language sql stable security definer set search_path = public, extensions as $$
  select exists (
    select 1 from public.app_secret
     where code_hash = encode(extensions.digest(coalesce(current_setting('request.headers', true)::json ->> 'x-office-key', ''), 'sha256'), 'hex')
  );
$$;
create or replace function public.office_check() returns boolean language sql stable as $$ select public.office_key_ok(); $$;
grant execute on function public.office_key_ok() to anon, authenticated;
grant execute on function public.office_check() to anon, authenticated;

-- היסטוריית שינויים (200 גרסאות אחרונות לכל חלק) לשחזור במקרה הצורך
create or replace function public.app_kv_keep_history()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.app_kv_history (key, value, saved_by) values (new.key, new.value, new.updated_by);
  delete from public.app_kv_history
   where key = new.key
     and id not in (select id from public.app_kv_history where key = new.key order by id desc limit 200);
  return new;
end $$;
drop trigger if exists app_kv_history_trg on public.app_kv;
create trigger app_kv_history_trg after insert or update on public.app_kv
  for each row execute function public.app_kv_keep_history();

-- אבטחה
alter table public.app_kv enable row level security;
alter table public.app_kv_history enable row level security;
alter table public.app_secret enable row level security;   -- אין לאף אחד גישה ישירה לטבלה הזו

drop policy if exists "team read"   on public.app_kv;
drop policy if exists "team insert" on public.app_kv;
drop policy if exists "team update" on public.app_kv;
drop policy if exists "office read"   on public.app_kv;
drop policy if exists "office insert" on public.app_kv;
drop policy if exists "office update" on public.app_kv;
drop policy if exists "team read history" on public.app_kv_history;
drop policy if exists "office read history" on public.app_kv_history;

create policy "office read"   on public.app_kv for select to anon, authenticated using (public.office_key_ok());
create policy "office insert" on public.app_kv for insert to anon, authenticated with check (public.office_key_ok());
create policy "office update" on public.app_kv for update to anon, authenticated using (public.office_key_ok()) with check (public.office_key_ok());
create policy "office read history" on public.app_kv_history for select to anon, authenticated using (public.office_key_ok());
