-- 漫步勇者 0.1.5：玩家編號（已套用到專案 eugkdfhkoaxvqhztvptc）
-- 用信箱註冊／登入後的正式帳號才會拿到流水號編號；匿名遊客沒有編號。
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  player_no bigint generated always as identity unique,
  created_at timestamptz not null default now()
);
comment on table public.profiles is '漫步勇者：正式玩家的流水號編號';

alter table public.profiles enable row level security;

create policy "read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);

-- 領取（或查詢）自己的編號。匿名帳號回傳 null。
create or replace function public.claim_player_no()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  no bigint;
begin
  if uid is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    return null;
  end if;
  insert into public.profiles (user_id) values (uid) on conflict (user_id) do nothing;
  select player_no into no from public.profiles where user_id = uid;
  return no;
end;
$$;

revoke execute on function public.claim_player_no() from public, anon;
grant execute on function public.claim_player_no() to authenticated;
