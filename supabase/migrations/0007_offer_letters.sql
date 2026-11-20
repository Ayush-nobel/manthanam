-- Offer letters (internships and jobs), issued from /admin/letters. Each row is one letter; the PDF is
-- rebuilt from these details whenever it's downloaded, so nothing else needs storing.

create table if not exists public.offer_letters (
    id                  uuid primary key default gen_random_uuid(),
    number              bigint generated always as identity,
    issue_date          date not null default (now() at time zone 'Asia/Kolkata')::date,
    -- e.g. MRF/OL/2026/0007: printed on the letter.
    reference           text generated always as ('MRF/OL/' || extract(year from issue_date)::int || '/' || lpad(number::text, 4, '0')) stored,
    -- Random, unguessable: printed on the letter and in its QR code, and the only way to look a letter up at /verify.
    verify_code         text not null unique check (verify_code ~ '^[A-Z0-9]{5}-[A-Z0-9]{5}$'),
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    kind                text not null check (kind in ('internship', 'job')),
    full_name           text not null check (char_length(full_name) between 1 and 120),
    email               text not null,
    position            text not null check (char_length(position) between 1 and 120),
    department          text not null check (char_length(department) between 1 and 120),
    start_date          date not null,
    end_date            date check (end_date is null or end_date >= start_date),
    commitment          text not null default '',
    work_mode           text not null check (work_mode in ('remote', 'in_person', 'hybrid')),
    location            text not null default '',
    compensation        text not null default '',
    reporting_to        text not null default '',
    benefits            text not null default '',
    additional_terms    text not null default '',
    respond_by          date not null,
    signatory_name      text not null,
    signatory_title     text not null default '',
    status              text not null default 'not_sent' check (status in ('not_sent', 'sent', 'accepted', 'declined', 'withdrawn')),
    email_sent_at       timestamptz,
    notes               text not null default '',
    application_id      uuid references public.applications (id) on delete set null,
    created_by          uuid references auth.users (id) on delete set null,
    created_by_email    text not null default ''
);
create unique index if not exists offer_letters_number on public.offer_letters (number);
create index if not exists offer_letters_created_at on public.offer_letters (created_at desc);

drop trigger if exists offer_letters_touch on public.offer_letters;
create trigger offer_letters_touch before update on public.offer_letters
    for each row execute function public.touch_updated_at();

-- Server-only, like every other table: RLS on with no policies, and nothing for the public keys.
alter table public.offer_letters enable row level security;
revoke all on public.offer_letters from anon, authenticated;
