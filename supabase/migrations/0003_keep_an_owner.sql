-- The admin dashboard must always have at least one owner. The website already refuses to remove or
-- demote the last owner; this makes the database refuse it too, even if two changes happen at once.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste this file → Run.

create or replace function public.keep_an_owner() returns trigger
language plpgsql set search_path = '' as $$
begin
    if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner') then
        -- One change to owners at a time, so two simultaneous demotions can't both pass the count.
        perform pg_advisory_xact_lock(hashtext('public.admin_users.owner'));
        if not exists (select 1 from public.admin_users where role = 'owner' and user_id <> old.user_id) then
            raise exception 'There must always be at least one owner.';
        end if;
    end if;
    return coalesce(new, old);
end $$;

drop trigger if exists admin_users_keep_an_owner on public.admin_users;
create trigger admin_users_keep_an_owner before update of role or delete on public.admin_users
    for each row execute function public.keep_an_owner();
