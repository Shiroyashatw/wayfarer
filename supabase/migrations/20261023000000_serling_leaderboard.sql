-- 塞令老師（0.1.29）：排行榜、各職業勝率
-- runs 多記：這局的職業 cls、打完後的分數 rating_end（排行榜用最後一局打完的分數）
alter table public.runs add column if not exists cls text;
alter table public.runs add column if not exists rating_end int;
create index if not exists runs_user_idx on public.runs (user_id, finished_at desc);

-- 排行榜：每個玩家（不含種子）最後一局打完的分數，前 p_n 名
create or replace function public.leaderboard(p_n int default 20)
returns table (name text, avatar text, rating int, games int, wins int)
language sql
stable
security invoker
as $$
  with r as (
    select * from public.runs where not seed and finished_at is not null and rating_end is not null
  ),
  last as (
    select distinct on (user_id) user_id, name, avatar, rating_end
    from r order by user_id, finished_at desc
  ),
  cnt as (
    select user_id, count(*)::int as games, count(*) filter (where place = 1)::int as wins from r group by user_id
  )
  select l.name, l.avatar, l.rating_end, c.games, c.wins
  from last l join cnt c using (user_id)
  order by l.rating_end desc
  limit greatest(1, least(p_n, 50));
$$;
grant execute on function public.leaderboard(int) to authenticated;

-- 各職業：最近 p_days 天打完的局數、第 1 名次數、平均名次；p_seed 也算種子（機器人）對局
create or replace function public.class_stats(p_seed boolean default false, p_days int default 30)
returns table (cls text, games int, wins int, avg_place numeric)
language sql
stable
security invoker
as $$
  select cls, count(*)::int, count(*) filter (where place = 1)::int, round(avg(place), 2)
  from public.runs
  where cls is not null and place is not null
    and (p_seed or not seed)
    and finished_at > now() - make_interval(days => p_days)
  group by cls;
$$;
grant execute on function public.class_stats(boolean, int) to authenticated;
