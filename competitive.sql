-- Apply AFTER schema.sql. Authoritative challenge matching: clients never write scores.
-- IMPORTANT: do not grant SELECT on private match sessions.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.challenge_sessions (
 challenge_id uuid primary key references public.challenges(id) on delete cascade,
 player_id uuid not null references auth.users(id) on delete cascade,
 deck jsonb not null,
 revealed_index integer,
 matched integer[] not null default '{}',
 mistakes integer not null default 0,
 combo integer not null default 0,
 bonus integer not null default 0,
 started_at timestamptz not null default clock_timestamp(),
 last_flip_at timestamptz,
 finished_at timestamptz,
 score integer
);
revoke all on private.challenge_sessions from public, anon, authenticated;
-- Prevent submitting forged scores through ordinary Supabase table updates.
drop policy if exists "receiver can complete" on public.challenges;
revoke update on public.challenges from authenticated, anon;
-- A definer function is the sole authority to mark completion.
create or replace function public.start_competitive_match(p_challenge uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c public.challenges%rowtype; s private.challenge_sessions%rowtype; deck jsonb; n integer;
begin
 if auth.uid() is null then raise exception 'Sign in to compete'; end if;
 select * into c from public.challenges where id=p_challenge and receiver_id=auth.uid() for update;
 if not found or c.status <> 'pending' or c.expires_at <= clock_timestamp() then raise exception 'Challenge unavailable'; end if;
 select * into s from private.challenge_sessions where challenge_id=p_challenge;
 if not found then
  -- Store both faces privately; return only their positions until individually flipped.
  select jsonb_agg(jsonb_build_object('word',word,'pair',pair_no) order by random()) into deck
  from (select a.word, p.pair_no from jsonb_array_elements(c.pairs) with ordinality p(item,pair_no)
        cross join lateral (values (p.item->>0),(p.item->>1)) a(word)) a;
  insert into private.challenge_sessions(challenge_id,player_id,deck) values(p_challenge,auth.uid(),deck) returning * into s;
 end if;
 if s.finished_at is not null then raise exception 'Already completed'; end if;
 if clock_timestamp() >= s.started_at+interval '30 seconds' then raise exception 'Match expired'; end if;
 return jsonb_build_object('session',s.challenge_id,'cards',jsonb_array_length(s.deck),'seconds',greatest(0,30-extract(epoch from clock_timestamp()-s.started_at))::integer);
end $$;
-- Each card is revealed and scored independently on the server.
-- No authoritative deck or score is ever accepted from the browser.
create or replace function public.flip_competitive_card(p_challenge uuid, p_index integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s private.challenge_sessions%rowtype; c public.challenges%rowtype;
 first_card jsonb; second_card jsonb; good boolean := false; finished boolean := false;
 elapsed numeric; remaining integer; n integer; points integer; score_out integer; new_combo integer; first_idx integer;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select * into s from private.challenge_sessions where challenge_id=p_challenge and player_id=auth.uid() for update;
 if not found then raise exception 'Start the match first'; end if;
 select * into c from public.challenges where id=p_challenge and receiver_id=auth.uid() for update;
 if not found or c.status <> 'pending' or c.expires_at<=clock_timestamp() or s.finished_at is not null then raise exception 'Challenge no longer open'; end if;
 n:=jsonb_array_length(s.deck);
 if p_index is null or p_index<0 or p_index>=n or p_index=any(s.matched) or p_index is not distinct from s.revealed_index then raise exception 'Invalid card selection'; end if;
 elapsed:=extract(epoch from clock_timestamp()-s.started_at);
 if elapsed>=30 then raise exception 'Time expired'; end if;
 -- Bounds automatic high-frequency scripts without slowing normal hand play.
 if s.last_flip_at is not null and clock_timestamp()-s.last_flip_at < interval '100 milliseconds' then raise exception 'Cards selected too quickly'; end if;
 second_card:=s.deck->p_index;
 if s.revealed_index is null then
  update private.challenge_sessions set revealed_index=p_index,last_flip_at=clock_timestamp() where challenge_id=p_challenge;
  return jsonb_build_object('index',p_index,'word',second_card->>'word','first',true,'remaining',greatest(0,30-elapsed)::integer);
 end if;
 first_idx:=s.revealed_index;
 first_card:=s.deck->s.revealed_index;
 good := first_card->>'pair'=second_card->>'pair';
 if good then
  new_combo:=s.combo+1;
  points:=least(new_combo-1,4)*5;
  -- Intentionally exclude client-computed rare-word points from verified scoring.
  update private.challenge_sessions set matched=matched||array[s.revealed_index,p_index],combo=new_combo,bonus=bonus+points,revealed_index=null,last_flip_at=clock_timestamp() where challenge_id=p_challenge returning * into s;
 else
  update private.challenge_sessions set mistakes=mistakes+1,combo=0,revealed_index=null,last_flip_at=clock_timestamp() where challenge_id=p_challenge returning * into s;
 end if;
 finished:=cardinality(s.matched)=n;
 remaining:=greatest(0,ceil(30-extract(epoch from clock_timestamp()-s.started_at)))::integer;
 if finished then
  score_out:=greatest(n/2*10,n/2*10+50+remaining*2-s.mistakes*5)+case when s.mistakes=0 then 30 else 0 end+s.bonus;
  update private.challenge_sessions set finished_at=clock_timestamp(),score=score_out where challenge_id=p_challenge;
  update public.challenges set status='completed',response_score=score_out where id=p_challenge;
 end if;
 return jsonb_build_object('index',p_index,'word',second_card->>'word','first',false,'matched',good,'first_index',first_idx,
  'pairs',cardinality(s.matched)/2,'mistakes',s.mistakes,'combo',s.combo,'bonus',s.bonus,'finished',finished,'score',score_out,'remaining',remaining);
end $$;
revoke all on function public.start_competitive_match(uuid) from public,anon;
revoke all on function public.flip_competitive_card(uuid,integer) from public,anon;
grant execute on function public.start_competitive_match(uuid) to authenticated;
grant execute on function public.flip_competitive_card(uuid,integer) to authenticated;

-- Record an incomplete attempt as zero; a 30-second challenge cannot be replayed.
create or replace function public.end_competitive_match(p_challenge uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare s private.challenge_sessions%rowtype; c public.challenges%rowtype;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select * into c from public.challenges where id=p_challenge and receiver_id=auth.uid() for update;
 if not found then raise exception 'Challenge not found'; end if;
 select * into s from private.challenge_sessions where challenge_id=p_challenge and player_id=auth.uid() for update;
 if not found then raise exception 'No attempt started'; end if;
 if s.finished_at is not null then return coalesce(s.score,0); end if;
 if c.status <> 'pending' then raise exception 'Challenge no longer open'; end if;
 update private.challenge_sessions set finished_at=clock_timestamp(),score=0 where challenge_id=p_challenge;
 update public.challenges set status='completed',response_score=0 where id=p_challenge;
 return 0;
end $$;
revoke all on function public.end_competitive_match(uuid) from public,anon;
grant execute on function public.end_competitive_match(uuid) to authenticated;
