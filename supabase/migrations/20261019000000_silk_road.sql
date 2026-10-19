-- 漫步勇者 0.2.3：絲綢之路（好友據點連線）（已套用到專案 eugkdfhkoaxvqhztvptc）
-- 主據點座標存在 profiles，但其他人只能透過 silk_list() 看到「已經和自己連線」的人的據點。

alter table public.profiles
  add column base_lat double precision,
  add column base_lng double precision,
  add column base_lv int not null default 0;
grant update (base_lat, base_lng, base_lv) on public.profiles to authenticated;

-- 商路：a < b，雙方各算一條
create table public.silk_roads (
  a uuid not null references auth.users(id) on delete cascade,
  b uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (a, b),
  check (a < b)
);
create index silk_roads_b_idx on public.silk_roads (b);
alter table public.silk_roads enable row level security;
create policy "see own silk roads" on public.silk_roads
  for select to authenticated using ((select auth.uid()) in (a, b));

-- 建立商路：只能和好友，雙方都要有主據點，每人免費 1 條
create or replace function public.silk_create(other uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  lim int := 1;
begin
  if me is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then return 'guest'; end if;
  if not public.is_friend(other) then return 'not_friend'; end if;
  if exists (select 1 from public.silk_roads where a = least(me, other) and b = greatest(me, other)) then return 'already'; end if;
  if not exists (select 1 from public.profiles where user_id = me and base_lat is not null) then return 'no_base'; end if;
  if not exists (select 1 from public.profiles where user_id = other and base_lat is not null) then return 'friend_no_base'; end if;
  if (select count(*) from public.silk_roads where me in (a, b)) >= lim then return 'limit'; end if;
  if (select count(*) from public.silk_roads where other in (a, b)) >= lim then return 'friend_limit'; end if;
  insert into public.silk_roads (a, b) values (least(me, other), greatest(me, other));
  return 'ok';
end;
$$;

create or replace function public.silk_remove(other uuid)
returns void language sql security definer set search_path = '' as $$
  delete from public.silk_roads where a = least(auth.uid(), other) and b = greatest(auth.uid(), other);
$$;

-- 自己的商路，附上對方的名字與主據點
create or replace function public.silk_list()
returns table (user_id uuid, name text, lv int, base_lat double precision, base_lng double precision, base_lv int, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.user_id, p.name, p.lv, p.base_lat, p.base_lng, p.base_lv, r.created_at
  from public.silk_roads r
  join public.profiles p on p.user_id = case when r.a = auth.uid() then r.b else r.a end
  where auth.uid() in (r.a, r.b)
  order by r.created_at;
$$;

revoke execute on function public.silk_create(uuid), public.silk_remove(uuid), public.silk_list() from public, anon;
grant execute on function public.silk_create(uuid), public.silk_remove(uuid), public.silk_list() to authenticated;
