-- AI usage quota per user. New accounts start with 5 free AI generations.
-- Tracked server-side and consumed atomically via SECURITY DEFINER RPC so the
-- client cannot bypass the counter.

create table if not exists public.user_quota (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  free_left int  not null default 5,
  used      int  not null default 0,
  updated_at timestamptz default now()
);

alter table public.user_quota enable row level security;

-- read-only policy: a user can see their own row
drop policy if exists "own quota" on public.user_quota;
create policy "own quota" on public.user_quota for select using (auth.uid() = user_id);

-- auto-create a quota row when a new auth user signs up (Google or email).
create or replace function public.handle_new_user_quota()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_quota (user_id, free_left) values (new.id, 5)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_quota on auth.users;
create trigger on_auth_user_created_quota
  after insert on auth.users for each row execute function public.handle_new_user_quota();

-- Backfill rows for any users that signed up BEFORE this trigger existed.
insert into public.user_quota (user_id, free_left)
select id, 5 from auth.users
on conflict (user_id) do nothing;

-- consume one credit, atomically. Returns the row AFTER decrement (or NULL if
-- the caller is unauthenticated or out of free credits — caller treats as block).
create or replace function public.consume_ai_credit()
returns table (free_left int, used int)
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return;
  end if;
  -- ensure a row exists (covers any edge case where the trigger didn't fire)
  insert into public.user_quota (user_id, free_left) values (uid, 5)
  on conflict (user_id) do nothing;

  return query
    update public.user_quota q
       set free_left = q.free_left - 1,
           used      = q.used + 1,
           updated_at = now()
     where q.user_id = uid and q.free_left > 0
    returning q.free_left, q.used;
end;
$$;

grant execute on function public.consume_ai_credit() to authenticated;
