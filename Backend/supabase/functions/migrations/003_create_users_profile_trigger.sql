-- 003_create_users_profile_trigger.sql
-- Creates a trigger to insert a users_profile row after a new auth.users row is created.
-- Idempotent: drops existing trigger/function if present and recreates them.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_auth_user();

alter table if exists public.users_profile
  add column if not exists raw_user_meta_data jsonb;
alter table if exists public.users_profile
  add column if not exists email text;

create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public.users_profile (id, ho_ten, email, raw_user_meta_data, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'ho_ten', ''),
    new.email,
    new.raw_user_meta_data,
    now()
  )
  on conflict (id) do update
    set raw_user_meta_data = coalesce(public.users_profile.raw_user_meta_data, EXCLUDED.raw_user_meta_data)
  ;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
