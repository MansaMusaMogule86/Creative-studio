-- Website inquiries from POST /api/leads.
-- Apply in Supabase (SQL editor or `supabase db push`). Not applied automatically.
create extension if not exists pgcrypto;

create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  submission_id    uuid not null unique,            -- browser UUID: idempotency key
  name             text not null check (char_length(name) between 2 and 120),
  email            text not null check (char_length(email) <= 254),
  company          text check (char_length(company) <= 160),
  phone            text check (char_length(phone) <= 32),
  services         text[] not null check (cardinality(services) between 1 and 20),
  description      text not null check (char_length(description) between 20 and 4000),
  budget           text not null,
  contact_channel  text not null check (contact_channel in ('email', 'phone', 'video')),
  attribution      jsonb not null default '{}'::jsonb,
  ip_hash          text not null,                    -- salted SHA-256, never the raw IP
  user_agent       text,
  crm_status       text not null default 'pending' check (crm_status in ('pending', 'sent', 'failed', 'skipped')),
  crm_contact_id   text,
  crm_error        text
);

create index if not exists leads_ip_recent_idx on public.leads (ip_hash, created_at desc);
create index if not exists leads_crm_status_idx on public.leads (crm_status) where crm_status in ('pending', 'failed');

-- Row Level Security on with no policies: the anon and authenticated roles can
-- neither read nor write. Only the server (service role) touches this table.
alter table public.leads enable row level security;
revoke all on public.leads from anon, authenticated;
