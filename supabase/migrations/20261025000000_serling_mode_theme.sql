-- 塞令老師（0.1.69）：快照對手只配同一個賽制＋主題
-- runs 多記：mode（賽制，MODES 的 k）、theme（道具池的主題，POOLTH 的 k）
alter table public.runs add column if not exists mode text;
alter table public.runs add column if not exists theme text;
create index if not exists runs_ver_mode_theme on public.runs (ver, mode, theme);

-- 配對：同一個快照版本、同一個賽制＋主題、分數相近（±300），真人優先
create or replace function public.pick_rivals_mt(p_ver text, p_rating int, p_n int, p_mode text, p_theme text)
returns setof public.runs
language sql
stable
security invoker
as $$
  select * from public.runs
  where ver = p_ver
    and mode = p_mode
    and theme = p_theme
    and user_id <> auth.uid()
    and rounds >= 6
    and abs(rating - p_rating) <= 300
  order by seed, random()
  limit greatest(1, least(p_n, 3));
$$;
grant execute on function public.pick_rivals_mt(text, int, int, text, text) to authenticated;
