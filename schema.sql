-- Popcards MVP backend. Run in Supabase SQL editor.
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check (username ~ '^[a-z0-9._]{3,20}$'),
 display_name text not null default 'Player',
 created_at timestamptz not null default now()
);
create table if not exists public.friend_requests (
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references public.profiles(id) on delete cascade,
 receiver_id uuid not null references public.profiles(id) on delete cascade,
 status text not null default 'pending' check (status in ('pending','accepted','declined')),
 created_at timestamptz not null default now(),
 responded_at timestamptz,
 check (sender_id <> receiver_id),
 unique (sender_id, receiver_id)
);
create table if not exists public.challenges (
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references public.profiles(id) on delete cascade,
 receiver_id uuid not null references public.profiles(id) on delete cascade,
 pairs jsonb not null check (jsonb_typeof(pairs)='array' and jsonb_array_length(pairs) between 2 and 6),
 target_score integer not null check (target_score between 0 and 100000),
 response_score integer check (response_score between 0 and 100000),
 status text not null default 'pending' check (status in ('pending','completed')),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '24 hours'),
 completed_at timestamptz,
 check (sender_id <> receiver_id)
);
create index if not exists friend_receiver_idx on public.friend_requests(receiver_id,status);
create index if not exists challenge_receiver_idx on public.challenges(receiver_id,created_at desc);
create or replace function public.are_friends(a uuid,b uuid) returns boolean language sql stable security definer set search_path = public as $$
 select exists (select 1 from public.friend_requests f where f.status='accepted' and ((f.sender_id=a and f.receiver_id=b) or (f.sender_id=b and f.receiver_id=a)));
$$;
revoke all on function public.are_friends(uuid,uuid) from public;
grant execute on function public.are_friends(uuid,uuid) to authenticated;
alter table public.profiles enable row level security;
alter table public.friend_requests enable row level security;
alter table public.challenges enable row level security;
drop policy if exists "profiles visible to members" on public.profiles;
create policy "profiles visible to members" on public.profiles for select to authenticated using (true);
drop policy if exists "create own profile" on public.profiles;
create policy "create own profile" on public.profiles for insert to authenticated with check (id=auth.uid());
drop policy if exists "edit own profile" on public.profiles;
create policy "edit own profile" on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
drop policy if exists "participants can read requests" on public.friend_requests;
create policy "participants can read requests" on public.friend_requests for select to authenticated using(sender_id=auth.uid() or receiver_id=auth.uid());
drop policy if exists "sender can request" on public.friend_requests;
create policy "sender can request" on public.friend_requests for insert to authenticated with check(sender_id=auth.uid() and status='pending');
drop policy if exists "receiver can respond" on public.friend_requests;
create policy "receiver can respond" on public.friend_requests for update to authenticated using(receiver_id=auth.uid() and status='pending') with check(receiver_id=auth.uid() and status in ('accepted','declined'));
drop policy if exists "sender can resend declined" on public.friend_requests;
create policy "sender can resend declined" on public.friend_requests
 for update to authenticated
 using(sender_id=auth.uid() and status='declined')
 with check(sender_id=auth.uid() and status='pending');
drop policy if exists "participants can read challenges" on public.challenges;
create policy "participants can read challenges" on public.challenges for select to authenticated using(sender_id=auth.uid() or receiver_id=auth.uid());
drop policy if exists "friends can challenge" on public.challenges;
create policy "friends can challenge" on public.challenges for insert to authenticated with check(sender_id=auth.uid() and public.are_friends(sender_id,receiver_id) and status='pending' and expires_at<=now()+interval '24 hours' and expires_at>now());
drop policy if exists "receiver can complete" on public.challenges;
create policy "receiver can complete" on public.challenges for update to authenticated using(receiver_id=auth.uid() and status='pending' and expires_at>now()) with check(receiver_id=auth.uid() and status='completed' and response_score is not null);
-- Enforce immutable challenge fields and one attempt on database updates.
create or replace function public.guard_challenge_update() returns trigger language plpgsql as $$
begin
 if old.status <> 'pending' or old.expires_at <= now() then raise exception 'Challenge no longer open'; end if;
 if new.id<>old.id or new.sender_id<>old.sender_id or new.receiver_id<>old.receiver_id or new.pairs<>old.pairs or new.target_score<>old.target_score or new.created_at<>old.created_at or new.expires_at<>old.expires_at then raise exception 'Challenge rules cannot be changed'; end if;
 if new.status <> 'completed' or new.response_score is null then raise exception 'Invalid completion'; end if;
 new.completed_at=now();return new;
end $$;
drop trigger if exists guard_challenge_update on public.challenges;
create trigger guard_challenge_update before update on public.challenges for each row execute function public.guard_challenge_update();
-- In Supabase Dashboard > Database > Replication, enable these tables for realtime:
-- public.friend_requests, public.challenges.
-- Keep identity fields immutable when accepting / declining friend requests.
create or replace function public.guard_friend_request_update() returns trigger language plpgsql as $$
begin
 if new.id<>old.id or new.sender_id<>old.sender_id or new.receiver_id<>old.receiver_id or new.created_at<>old.created_at then raise exception 'Request identities are immutable'; end if;
 if old.status='declined' and new.status='pending' and old.sender_id=auth.uid() then
  new.responded_at=null;return new;
 end if;
 if old.status <> 'pending' or new.status not in ('accepted','declined') then raise exception 'Request can only be answered once'; end if;
 new.responded_at=now();return new;
end $$;
drop trigger if exists guard_friend_request_update on public.friend_requests;
create trigger guard_friend_request_update before update on public.friend_requests for each row execute function public.guard_friend_request_update();

-- 3 clues per player, replenished 24 hours after the first clue of a cycle.
-- Re-run schema.sql in the Supabase SQL editor to apply this migration.
create table if not exists public.clue_allowances (
 user_id uuid primary key references auth.users(id) on delete cascade,
 remaining integer not null default 3 check (remaining between 0 and 3),
 reset_at timestamptz
);
alter table public.clue_allowances enable row level security;
drop policy if exists "read own clues" on public.clue_allowances;
create policy "read own clues" on public.clue_allowances
 for select to authenticated using (user_id=auth.uid());
-- No INSERT/UPDATE policy: balances can only change using the security-definer RPC.
create or replace function public.get_clue_allowance()
returns table(remaining integer, reset_at timestamptz)
language plpgsql security definer set search_path=public as $$
declare uid uuid := auth.uid(); now_ts timestamptz := clock_timestamp(); r public.clue_allowances%rowtype;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 insert into public.clue_allowances(user_id) values(uid) on conflict(user_id) do nothing;
 select * into r from public.clue_allowances where user_id=uid for update;
 if r.reset_at is not null and r.reset_at<=now_ts then
  update public.clue_allowances set remaining=3,reset_at=null where user_id=uid returning * into r;
 end if;
 return query select r.remaining,r.reset_at;
end $$;
create or replace function public.consume_clue()
returns table(remaining integer, reset_at timestamptz, consumed boolean)
language plpgsql security definer set search_path=public as $$
declare uid uuid := auth.uid(); now_ts timestamptz := clock_timestamp(); r public.clue_allowances%rowtype; did_consume boolean := false;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 insert into public.clue_allowances(user_id) values(uid) on conflict(user_id) do nothing;
 select * into r from public.clue_allowances where user_id=uid for update;
 if r.reset_at is not null and r.reset_at<=now_ts then
  update public.clue_allowances set remaining=3,reset_at=null where user_id=uid returning * into r;
 end if;
 if r.remaining>0 then
  update public.clue_allowances
   set remaining=r.remaining-1,
       reset_at=coalesce(r.reset_at,now_ts+interval '24 hours')
   where user_id=uid returning * into r;
  did_consume:=true;
 end if;
 return query select r.remaining,r.reset_at,did_consume;
end $$;
revoke all on function public.get_clue_allowance() from public,anon;
revoke all on function public.consume_clue() from public,anon;
grant execute on function public.get_clue_allowance() to authenticated;
grant execute on function public.consume_clue() to authenticated;
