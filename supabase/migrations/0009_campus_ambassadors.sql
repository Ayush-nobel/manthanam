-- Campus ambassador applications (manthanam.in/register/ambassador) use the internship applications table
-- with role 'ambassador', so they appear in /admin/applications with replies, statuses and the Excel export.
-- Run once in Supabase's SQL Editor, after 0001–0008. Safe to run again.

alter table public.applications drop constraint if exists applications_role_check;
alter table public.applications
    add constraint applications_role_check check (role in ('social', 'outreach', 'pr', 'ambassador'));
