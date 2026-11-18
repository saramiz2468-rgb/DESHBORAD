-- מערכת ניהול תיקים · הקמת מסד הנתונים ב-Supabase
-- להעתיק את כל הקובץ ל-SQL Editor בפרויקט וללחוץ Run. אפשר להריץ שוב בלי נזק.

-- טבלה אחת שמחזיקה את מצב המערכת המשותף (תיקים, תביעות, הסכמים וכו')
create table if not exists public.app_kv (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- היסטוריית שינויים: כל שמירה נרשמת כאן, כדי שאפשר יהיה לשחזר מצב קודם
create table if not exists public.app_kv_history (
  id         bigint generated always as identity primary key,
  key        text not null,
  value      jsonb not null,
  saved_at   timestamptz not null default now(),
  saved_by   text
);

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

-- אבטחה: רק משתמשים מחוברים (שנוצרו ע"י מנהלת המערכת) יכולים לקרוא ולכתוב
alter table public.app_kv enable row level security;
alter table public.app_kv_history enable row level security;

drop policy if exists "team read"   on public.app_kv;
drop policy if exists "team insert" on public.app_kv;
drop policy if exists "team update" on public.app_kv;
drop policy if exists "team read history" on public.app_kv_history;

create policy "team read"   on public.app_kv for select to authenticated using (true);
create policy "team insert" on public.app_kv for insert to authenticated with check (true);
create policy "team update" on public.app_kv for update to authenticated using (true) with check (true);
create policy "team read history" on public.app_kv_history for select to authenticated using (true);

-- עדכונים בזמן אמת בין כל המכשירים
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_kv'
  ) then
    alter publication supabase_realtime add table public.app_kv;
  end if;
end $$;
