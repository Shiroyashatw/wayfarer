-- 塞令老師（0.1.45）：核心統計
-- runs 多記：最後的第一個核心 core1、融入的第二個核心 core2、首領核心三選一的紀錄 core_log
-- core_log 是陣列，每一筆 { "o": [給的三個核心], "p": 選的那個, "r": 回合 }
alter table public.runs add column if not exists core1 text;
alter table public.runs add column if not exists core2 text;
alter table public.runs add column if not exists core_log jsonb;

-- 每個核心：三選一出現幾次、被選幾次、打到最後拿著的局數與平均名次
-- p_seed 也算種子（機器人）對局；p_cls 只看某個職業（null 是全部）
create or replace function public.core_stats(p_seed boolean default false, p_days int default 30, p_cls text default null)
returns table (cls text, core text, offered int, picked int, held int, avg_place numeric)
language sql
stable
security invoker
as $$
  with r as (
    select * from public.runs
    where place is not null and cls is not null
      and (p_seed or not seed)
      and finished_at > now() - make_interval(days => p_days)
      and (p_cls is null or cls = p_cls)
  ),
  o as (
    select r.cls, t.opt as core, e.v->>'p' as pick
    from r
    cross join lateral jsonb_array_elements(coalesce(r.core_log, '[]'::jsonb)) as e(v)
    cross join lateral jsonb_array_elements_text(e.v->'o') as t(opt)
  ),
  ofr as (
    select cls, core, count(*)::int as offered, count(*) filter (where core = pick)::int as picked from o group by 1, 2
  ),
  h as (
    select r.cls, u.c as core, count(*)::int as held, avg(r.place) as ap
    from r cross join lateral unnest(array[r.core1, r.core2]) as u(c)
    where u.c is not null group by 1, 2
  )
  select cls, core, coalesce(offered, 0), coalesce(picked, 0), coalesce(held, 0), round(ap, 2)
  from ofr full join h using (cls, core)
  order by cls, coalesce(picked, 0) desc;
$$;
grant execute on function public.core_stats(boolean, int, text) to authenticated;

-- 第一個＋第二個核心的組合：局數、平均名次
create or replace function public.core_combo_stats(p_seed boolean default false, p_days int default 30)
returns table (cls text, core1 text, core2 text, games int, avg_place numeric)
language sql
stable
security invoker
as $$
  select cls, core1, core2, count(*)::int, round(avg(place), 2)
  from public.runs
  where core1 is not null and core2 is not null and place is not null
    and (p_seed or not seed)
    and finished_at > now() - make_interval(days => p_days)
  group by 1, 2, 3
  order by count(*) desc;
$$;
grant execute on function public.core_combo_stats(boolean, int) to authenticated;
