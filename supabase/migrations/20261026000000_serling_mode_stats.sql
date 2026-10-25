-- 0.1.77 統計頁：照賽制、道具池（主題）篩選的職業勝率與核心選擇率。
-- p_mode／p_theme 是 null 就是全部；p_seed 也算種子（機器人）對局；只看最近 p_days 天打完的局。

-- 各職業：局數、第 1 名次數、平均名次
create or replace function public.class_stats_mt(
  p_seed boolean default false,
  p_days int default 30,
  p_mode text default null,
  p_theme text default null
)
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
    and (p_mode is null or mode = p_mode)
    and (p_theme is null or theme = p_theme)
  group by cls;
$$;
grant execute on function public.class_stats_mt(boolean, int, text, text) to authenticated;

-- 各職業的核心：三選一出現幾次、被選幾次、拿著幾局、拿著的平均名次
create or replace function public.core_stats_mt(
  p_seed boolean default false,
  p_days int default 30,
  p_mode text default null,
  p_theme text default null,
  p_cls text default null
)
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
      and (p_mode is null or mode = p_mode)
      and (p_theme is null or theme = p_theme)
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
grant execute on function public.core_stats_mt(boolean, int, text, text, text) to authenticated;
