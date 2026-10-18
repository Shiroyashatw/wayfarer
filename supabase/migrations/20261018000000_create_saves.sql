-- 漫步勇者：雲端存檔資料表（已套用到專案 eugkdfhkoaxvqhztvptc）
-- 每位玩家（含匿名登入）一列存檔，RLS 限制只能讀寫自己的資料。
create table public.saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  game_version text,
  updated_at timestamptz not null default now()
);

alter table public.saves enable row level security;

create policy "read own save" on public.saves
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own save" on public.saves
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own save" on public.saves
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
