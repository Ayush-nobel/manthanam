-- Conference payments: the payment email sent from /admin/registrations, and the proof of payment each
-- registrant uploads at manthanam.in/pay/<token> (a screenshot and the transaction details).
-- Run once in Supabase's SQL Editor, after 0001–0007. Safe to run again.

alter table public.registrations
    -- Random and unguessable: the personal link in the payment email. Whoever has it can upload proof for
    -- this one registration, and see its name, number and the fee; nothing else.
    add column if not exists payment_token          text unique check (payment_token is null or payment_token ~ '^[A-Za-z0-9_-]{32}$'),
    add column if not exists payment_email_sent_at  timestamptz,
    add column if not exists payment_submitted_at   timestamptz,
    -- UPI reference / UTR / transaction ID, as the registrant typed it.
    add column if not exists payment_reference      text not null default '' check (char_length(payment_reference) <= 40),
    add column if not exists payment_amount         integer check (payment_amount is null or payment_amount between 1 and 1000000),
    add column if not exists payment_paid_on        date,
    -- Only when someone else paid (a parent, a college): the name the payment shows.
    add column if not exists payment_payer_name     text not null default '' check (char_length(payment_payer_name) <= 100),
    -- Path of the screenshot in the private payment-proofs bucket, and its type.
    add column if not exists payment_proof_path     text,
    add column if not exists payment_proof_type     text;

create index if not exists registrations_payment_submitted on public.registrations (payment_submitted_at) where payment_submitted_at is not null;

-- Private bucket for the screenshots: not public, and no policies on storage.objects for it, so only the
-- website's server (secret key) can read or write. Admins see a proof through /admin/payment-proof/<id>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 4194304, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update
    set public = false,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;
