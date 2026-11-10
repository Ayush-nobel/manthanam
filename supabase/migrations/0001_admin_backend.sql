-- Manthanam website backend: admins and roles, conference registrations, contact messages, audit log.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste this file → Run.
-- See docs/backend.md.
--
-- Security model: every table has Row Level Security switched on and NO policies, so the public
-- "publishable" key cannot read or write anything. Only the website's server, using the secret
-- key, can; and it checks the signed-in admin's role (lib/permissions.ts) before every read or change.

-- Admins ------------------------------------------------------------------------------------------

create table if not exists public.admin_users (
    user_id     uuid primary key references auth.users (id) on delete cascade,
    email       text not null unique,
    name        text not null default '',
    -- owner: everything, including managing admins
    -- registrations: registrations and contact messages
    -- content: editing the website's content
    -- viewer: can look at registrations and messages, can't change anything
    role        text not null check (role in ('owner', 'registrations', 'content', 'viewer')),
    created_at  timestamptz not null default now(),
    created_by  uuid references auth.users (id) on delete set null
);

-- Registrations -----------------------------------------------------------------------------------

create table if not exists public.registrations (
    id                      uuid primary key default gen_random_uuid(),
    reference               text not null unique,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now(),
    event                   text not null default 'biyc-2026',

    full_name               text not null,
    email                   text not null,
    phone                   text not null,
    date_of_birth           date not null,
    minor                   boolean not null,
    participant_type        text not null,          -- Student, Professional… (the form's "Status")
    institution             text not null default '',
    city                    text not null,
    state                   text not null default '',
    country                 text not null,
    motivation              text not null default '',
    heard_from              text not null default '',
    access_needs            text not null default '',

    guardian_name           text not null default '',
    guardian_relation       text not null default '',
    guardian_email          text not null default '',
    guardian_phone          text not null default '',
    guardian_verified_at    timestamptz,
    guardian_verified_by    uuid references auth.users (id) on delete set null,

    -- The exact wording each person agreed to (consent record, DPDP Act s.6 and s.9).
    consent_text            text not null,
    guardian_consent_text   text not null default '',
    place_terms_text        text not null,
    privacy_policy_version  text not null,

    status                  text not null default 'new'
                            check (status in ('new', 'payment_pending', 'paid', 'confirmed', 'cancelled', 'refunded')),
    notes                   text not null default '',

    email_sent_at           timestamptz,
    sheet_synced_at         timestamptz
);
-- One registration per email address per event (case-insensitive).
create unique index if not exists registrations_event_email on public.registrations (event, lower(email));
create index if not exists registrations_created_at on public.registrations (created_at desc);
create index if not exists registrations_status on public.registrations (status);

-- Contact messages --------------------------------------------------------------------------------

create table if not exists public.contact_messages (
    id                      uuid primary key default gen_random_uuid(),
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now(),
    name                    text not null,
    email                   text not null,
    organisation            text not null default '',
    topic                   text not null default '',
    message                 text not null,
    sender                  text not null default 'adult' check (sender in ('adult', 'guardian')),
    consent_text            text not null default '',
    guardian_consent_text   text not null default '',
    privacy_policy_version  text not null default '',
    status                  text not null default 'new' check (status in ('new', 'replied', 'archived', 'spam')),
    notes                   text not null default ''
);
create index if not exists contact_messages_created_at on public.contact_messages (created_at desc);

-- Audit log: who changed what, and when -----------------------------------------------------------

create table if not exists public.audit_log (
    id          bigint generated always as identity primary key,
    at          timestamptz not null default now(),
    actor_id    uuid references auth.users (id) on delete set null,
    actor_email text not null default '',
    action      text not null,               -- e.g. registration.status, admin.add
    entity      text not null,               -- e.g. registration, contact_message, admin
    entity_id   text not null default '',
    detail      jsonb not null default '{}'::jsonb
);
create index if not exists audit_log_entity on public.audit_log (entity, entity_id, at desc);

-- updated_at --------------------------------------------------------------------------------------

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
    new.updated_at := now();
    return new;
end $$;

drop trigger if exists registrations_touch on public.registrations;
create trigger registrations_touch before update on public.registrations
    for each row execute function public.touch_updated_at();
drop trigger if exists contact_messages_touch on public.contact_messages;
create trigger contact_messages_touch before update on public.contact_messages
    for each row execute function public.touch_updated_at();

-- Lock everything down: no access with the public key -------------------------------------------

alter table public.admin_users      enable row level security;
alter table public.registrations    enable row level security;
alter table public.contact_messages enable row level security;
alter table public.audit_log        enable row level security;

revoke all on public.admin_users, public.registrations, public.contact_messages, public.audit_log from anon, authenticated;
