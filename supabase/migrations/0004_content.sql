-- Content editor: Insights articles and the conference details, edited from /admin/content.
-- Adds the "editor" admin role (publishes; the "content" role writes drafts).
-- Run once in the Supabase dashboard: SQL Editor → New query → paste this file → Run.

-- New role ----------------------------------------------------------------------------------------
alter table public.admin_users drop constraint if exists admin_users_role_check;
alter table public.admin_users add constraint admin_users_role_check
    check (role in ('owner', 'editor', 'content', 'registrations', 'viewer'));

-- Insights ----------------------------------------------------------------------------------------
create table if not exists public.insights (
    id              uuid primary key default gen_random_uuid(),
    slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
    title           text not null,
    summary         text not null default '',
    body            text not null default '',
    category        text not null check (category in ('Commentary', 'Analysis', 'Policy Brief', 'Discussion')),
    author_name     text not null default '',
    author_bio      text not null default '',
    -- The date printed on the piece (YYYY-MM-DD); set when first published unless chosen.
    display_date    date,
    status          text not null default 'draft' check (status in ('draft', 'in_review', 'published', 'archived')),
    review_note     text not null default '',
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    created_by      uuid references auth.users (id) on delete set null,
    updated_by      uuid references auth.users (id) on delete set null,
    published_at    timestamptz,
    published_by    uuid references auth.users (id) on delete set null
);
create index if not exists insights_status on public.insights (status, display_date desc);

drop trigger if exists insights_touch on public.insights;
create trigger insights_touch before update on public.insights
    for each row execute function public.touch_updated_at();

-- Site content: one row per page section, edited as a whole (e.g. key 'conference') ----------
create table if not exists public.site_content (
    key         text primary key,
    value       jsonb not null,
    updated_at  timestamptz not null default now(),
    updated_by  uuid references auth.users (id) on delete set null
);

drop trigger if exists site_content_touch on public.site_content;
create trigger site_content_touch before update on public.site_content
    for each row execute function public.touch_updated_at();

alter table public.insights     enable row level security;
alter table public.site_content enable row level security;
revoke all on public.insights, public.site_content from anon, authenticated;
