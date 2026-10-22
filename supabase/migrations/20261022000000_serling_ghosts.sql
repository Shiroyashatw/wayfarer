-- 塞令老師（0.4.0）：快照對戰
-- runs：一局；snaps：那一局每回合開戰前的背包快照。別人開局時抽分數相近的對局當對手。
-- 只靠 anon key + RLS：大家都能讀（才能當對手），只能寫自己的。

create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  ver text not null,
  name text,
  avatar text,
  rating int not null default 1000,
  rounds int not null default 0,
  place int,
  seed boolean not null default false,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
-- 已經跑過舊版這份 SQL 的話，補上 seed 欄位（種子資料：開服時預先產生的機器人對局）
alter table public.runs add column if not exists seed boolean not null default false;
create index if not exists runs_pick_idx on public.runs (ver, rating);

create table if not exists public.snaps (
  run_id uuid not null references public.runs (id) on delete cascade,
  round text not null,
  hp int not null,
  bag jsonb not null,
  created_at timestamptz not null default now(),
  primary key (run_id, round)
);

alter table public.runs enable row level security;
alter table public.snaps enable row level security;

drop policy if exists runs_read on public.runs;
create policy runs_read on public.runs for select to authenticated using (true);
drop policy if exists runs_insert on public.runs;
create policy runs_insert on public.runs for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists runs_update on public.runs;
create policy runs_update on public.runs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists snaps_read on public.snaps;
create policy snaps_read on public.snaps for select to authenticated using (true);
drop policy if exists snaps_write on public.snaps;
create policy snaps_write on public.snaps for insert to authenticated
  with check (exists (select 1 from public.runs r where r.id = run_id and r.user_id = auth.uid()));
drop policy if exists snaps_update on public.snaps;
create policy snaps_update on public.snaps for update to authenticated
  using (exists (select 1 from public.runs r where r.id = run_id and r.user_id = auth.uid()));

-- 抽對手：同版本、不是自己、至少打了 6 回合、分數 ±300 內；真人優先，不夠才用種子對局，隨機 p_n 局
create or replace function public.pick_rivals(p_ver text, p_rating int, p_n int default 3)
returns setof public.runs
language sql
stable
security invoker
as $$
  select * from public.runs
  where ver = p_ver
    and user_id <> auth.uid()
    and rounds >= 6
    and abs(rating - p_rating) <= 300
  order by seed, random()
  limit greatest(1, least(p_n, 3));
$$;
grant execute on function public.pick_rivals(text, int, int) to authenticated;
