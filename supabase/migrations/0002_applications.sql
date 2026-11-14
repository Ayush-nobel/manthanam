-- Internship applications from manthanam.in/join.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste this file → Run.

create table if not exists public.applications (
    id                      uuid primary key default gen_random_uuid(),
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now(),
    full_name               text not null,
    email                   text not null,
    phone                   text not null,
    city                    text not null,
    organisation            text not null,
    role                    text not null check (role in ('social', 'outreach', 'pr')),
    motivation              text not null,
    portfolio               text not null default '',
    adult_confirmed         boolean not null,
    consent_text            text not null,
    privacy_policy_version  text not null,
    status                  text not null default 'new'
                            check (status in ('new', 'shortlisted', 'interview', 'selected', 'not_selected', 'withdrawn')),
    notes                   text not null default '',
    email_sent_at           timestamptz
);
-- One application per person per role.
create unique index if not exists applications_email_role on public.applications (lower(email), role);
create index if not exists applications_created_at on public.applications (created_at desc);

drop trigger if exists applications_touch on public.applications;
create trigger applications_touch before update on public.applications
    for each row execute function public.touch_updated_at();

alter table public.applications enable row level security;
revoke all on public.applications from anon, authenticated;
