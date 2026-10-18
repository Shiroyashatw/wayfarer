-- 漫步勇者 0.1.6：好友與組隊邀請（已套用到專案 eugkdfhkoaxvqhztvptc）
-- 好友只限正式帳號（有玩家編號）。好友關係只能透過函式建立，避免直接亂寫資料表。

-- 玩家公開資料：名字、等級、職業、最後上線時間（給好友列表顯示）
alter table public.profiles
  add column name text not null default '旅人' check (char_length(name) between 1 and 12),
  add column lv int not null default 1,
  add column cls text not null default 'novice',
  add column seen_at timestamptz not null default now();

create policy "update own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke update on public.profiles from authenticated;
grant update (name, lv, cls, seen_at) on public.profiles to authenticated;

-- 好友關係：a 發出邀請、b 收到；accepted 後雙方都是好友
create table public.friendships (
  a uuid not null references auth.users(id) on delete cascade,
  b uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (a, b),
  check (a <> b)
);
create index friendships_b_idx on public.friendships (b);
alter table public.friendships enable row level security;
create policy "see own friendships" on public.friendships
  for select to authenticated using ((select auth.uid()) in (a, b));

create or replace function public.is_friend(other uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and ((a = auth.uid() and b = other) or (a = other and b = auth.uid()))
  );
$$;

-- 用玩家編號送出好友邀請。對方也邀請過你就直接成為好友。
create or replace function public.friend_request(target_no bigint)
returns text language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  t uuid;
begin
  if me is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then return 'guest'; end if;
  if not exists (select 1 from public.profiles where user_id = me) then return 'no_profile'; end if;
  select user_id into t from public.profiles where player_no = target_no;
  if t is null then return 'not_found'; end if;
  if t = me then return 'self'; end if;
  if exists (select 1 from public.friendships where status = 'accepted' and ((a = me and b = t) or (a = t and b = me))) then return 'already'; end if;
  if exists (select 1 from public.friendships where a = t and b = me) then
    update public.friendships set status = 'accepted' where a = t and b = me;
    return 'accepted';
  end if;
  insert into public.friendships (a, b) values (me, t) on conflict do nothing;
  return 'sent';
end;
$$;

-- 回應收到的邀請：接受或拒絕
create or replace function public.friend_respond(other uuid, accept boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if accept then
    update public.friendships set status = 'accepted' where a = other and b = auth.uid() and status = 'pending';
  else
    delete from public.friendships where a = other and b = auth.uid() and status = 'pending';
  end if;
end;
$$;

-- 刪除好友或取消送出的邀請
create or replace function public.friend_remove(other uuid)
returns void language sql security definer set search_path = '' as $$
  delete from public.friendships where (a = auth.uid() and b = other) or (a = other and b = auth.uid());
$$;

-- 好友列表（含待回應的邀請），附上對方的公開資料
create or replace function public.friend_list()
returns table (user_id uuid, player_no bigint, name text, lv int, cls text, seen_at timestamptz, status text, incoming boolean)
language sql stable security definer set search_path = '' as $$
  select p.user_id, p.player_no, p.name, p.lv, p.cls, p.seen_at, f.status, f.b = auth.uid()
  from public.friendships f
  join public.profiles p on p.user_id = case when f.a = auth.uid() then f.b else f.a end
  where auth.uid() in (f.a, f.b)
  order by f.status, p.seen_at desc;
$$;

revoke execute on function public.is_friend(uuid), public.friend_request(bigint), public.friend_respond(uuid, boolean), public.friend_remove(uuid), public.friend_list() from public, anon;
grant execute on function public.is_friend(uuid), public.friend_request(bigint), public.friend_respond(uuid, boolean), public.friend_remove(uuid), public.friend_list() to authenticated;

-- 組隊邀請：只能邀請好友。收到的人用 Realtime 即時收到通知
create table public.party_invites (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  to_id uuid not null references auth.users(id) on delete cascade,
  party text not null check (char_length(party) between 4 and 12),
  info jsonb not null default '{}' check (pg_column_size(info) < 2000),
  created_at timestamptz not null default now()
);
create index party_invites_to_idx on public.party_invites (to_id);
alter table public.party_invites enable row level security;
create policy "see own invites" on public.party_invites
  for select to authenticated using ((select auth.uid()) in (from_id, to_id));
create policy "invite friends" on public.party_invites
  for insert to authenticated with check (from_id = (select auth.uid()) and public.is_friend(to_id));
create policy "delete own invites" on public.party_invites
  for delete to authenticated using ((select auth.uid()) in (from_id, to_id));

alter publication supabase_realtime add table public.party_invites;
