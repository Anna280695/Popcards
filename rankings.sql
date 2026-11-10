-- Run after schema.sql. Rankings use each account's saved total score.
alter table public.profiles add column if not exists total_score bigint not null default 0 check (total_score >= 0);

create or replace function public.save_total_score(p_score bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare saved bigint;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if p_score < 0 then raise exception 'Invalid total score'; end if;
 update public.profiles set total_score = greatest(total_score, p_score)
 where id = auth.uid() returning total_score into saved;
 return saved;
end;
$$;
revoke all on function public.save_total_score(bigint) from public, anon;
grant execute on function public.save_total_score(bigint) to authenticated;

-- Keep the existing RPC contract for installed clients.
create or replace function public.verified_rankings()
returns table(player_id uuid, username text, display_name text,
 all_time_points bigint, weekly_points bigint, completed_matches bigint)
language sql stable security definer set search_path = '' as $$
 select p.id, p.username, p.display_name, p.total_score, 0::bigint, 0::bigint
 from public.profiles p
 where auth.uid() is not null
 order by p.total_score desc, p.id
 limit 1000;
$$;
revoke all on function public.verified_rankings() from public, anon;
grant execute on function public.verified_rankings() to authenticated;
