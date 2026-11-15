-- Replies to contact messages, written and sent from /admin/messages. Each row is one email that went out.

create table if not exists public.message_replies (
    id              uuid primary key default gen_random_uuid(),
    message_id      uuid not null references public.contact_messages (id) on delete cascade,
    created_at      timestamptz not null default now(),
    body            text not null check (char_length(body) between 1 and 10000),
    sent_to         text not null,
    sent_from       text not null,
    sent_by         uuid references auth.users (id) on delete set null,
    sent_by_name    text not null default '',
    sent_by_email   text not null default ''
);
create index if not exists message_replies_message on public.message_replies (message_id, created_at);

-- Server-only, like every other table: RLS on with no policies, and nothing for the public keys.
alter table public.message_replies enable row level security;
revoke all on public.message_replies from anon, authenticated;
