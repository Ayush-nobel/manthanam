-- Campus ambassador referral codes. An admin issues a code to a selected ambassador from
-- /admin/applications/<id>; delegates enter it on their payment form (/pay/<token>) and pay 10% less.
-- Run once in Supabase's SQL Editor, after 0001–0009. Safe to run again.

alter table public.applications
    add column if not exists referral_code text unique check (referral_code is null or referral_code ~ '^IYS-[A-Z0-9]{6}$'),
    add column if not exists referral_code_issued_at timestamptz,
    -- Campus ambassadors may be under 18 with a parent or guardian's consent (DPDP Act s.9).
    add column if not exists guardian_name text not null default '',
    add column if not exists guardian_email text not null default '',
    add column if not exists guardian_consent_text text not null default '';

alter table public.registrations
    add column if not exists referral_code text check (referral_code is null or referral_code ~ '^IYS-[A-Z0-9]{6}$');

create index if not exists registrations_referral_code on public.registrations (referral_code) where referral_code is not null;
