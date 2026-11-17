-- Replies to internship applicants, written and sent from /admin/applications. Each row is one email that went out.

create table if not exists public.application_replies (
    id              uuid primary key default gen_random_uuid(),
    application_id  uuid not null references public.applications (id) on delete cascade,
    created_at      timestamptz not null default now(),
    body            text not null check (char_length(body) between 1 and 10000),
    sent_to         text not null,
    sent_from       text not null,
    sent_by         uuid references auth.users (id) on delete set null,
    sent_by_name    text not null default '',
    sent_by_email   text not null default ''
);
create index if not exists application_replies_application on public.application_replies (application_id, created_at);

-- Server-only, like every other table: RLS on with no policies, and nothing for the public keys.
alter table public.application_replies enable row level security;
revoke all on public.application_replies from anon, authenticated;
