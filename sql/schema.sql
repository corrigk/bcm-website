-- ===========================================================
-- BCM WEBSITE — SUPABASE SCHEMA (full)
-- Safe to run more than once. Run this in your Supabase project's
-- SQL Editor: Dashboard → SQL Editor → New Query → paste this whole
-- file → Run.
--
-- If you already ran an earlier version of this file (from before
-- the member directory existed), just run this whole file again —
-- it will update the announcements/team_members policies to require
-- admin access instead of "any logged-in user."
-- ===========================================================

-- ---------- ANNOUNCEMENTS ----------
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);
alter table announcements enable row level security;

-- ---------- TEAM MEMBERS (ORG CHART) ----------
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  category text not null default 'Team',
  email text,
  "order" integer not null default 10,
  created_at timestamptz not null default now()
);
alter table team_members enable row level security;

-- ---------- MEMBER STATUS (access + approval + admin flag) ----------
-- One row per signed-up user. Created automatically the first time
-- someone logs in after signing up (see js/data.js -> ensureMemberRow).
create table if not exists member_status (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  approved boolean not null default false,
  is_admin boolean not null default false,
  requested_at timestamptz not null default now()
);
alter table member_status enable row level security;

-- ---------- MEMBER PROFILES (directory info) ----------
-- References member_status (not auth.users directly) so that
-- Supabase can embed "member_status.approved" when querying the
-- directory, which is how we only show approved members.
create table if not exists member_profiles (
  id uuid primary key references member_status(id) on delete cascade,
  name text not null,
  grad_year integer,
  major text,
  is_alumni boolean not null default false,
  company text,
  job_title text,
  location text,
  linkedin text,
  bio text,
  updated_at timestamptz not null default now()
);
alter table member_profiles enable row level security;

-- ===========================================================
-- HELPER FUNCTIONS (security definer = bypass RLS internally,
-- which avoids recursive-policy issues when a policy needs to
-- check the same table it's protecting)
-- ===========================================================
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select coalesce((select is_admin from member_status where id = auth.uid()), false);
$$;

create or replace function public.is_approved()
returns boolean language sql security definer stable as $$
  select coalesce((select approved from member_status where id = auth.uid()), false);
$$;

create or replace function public.is_approved_member(check_id uuid)
returns boolean language sql security definer stable as $$
  select coalesce((select approved from member_status where id = check_id), false);
$$;

-- ===========================================================
-- POLICIES — announcements
-- (public can read; only admins can write)
-- ===========================================================
drop policy if exists "Public can read announcements" on announcements;
create policy "Public can read announcements" on announcements
  for select using (true);

drop policy if exists "Authenticated users can insert announcements" on announcements;
drop policy if exists "Admins can insert announcements" on announcements;
create policy "Admins can insert announcements" on announcements
  for insert to authenticated with check (is_admin());

drop policy if exists "Authenticated users can update announcements" on announcements;
drop policy if exists "Admins can update announcements" on announcements;
create policy "Admins can update announcements" on announcements
  for update to authenticated using (is_admin());

drop policy if exists "Authenticated users can delete announcements" on announcements;
drop policy if exists "Admins can delete announcements" on announcements;
create policy "Admins can delete announcements" on announcements
  for delete to authenticated using (is_admin());

-- ===========================================================
-- POLICIES — team_members (org chart)
-- ===========================================================
drop policy if exists "Public can read team members" on team_members;
create policy "Public can read team members" on team_members
  for select using (true);

drop policy if exists "Authenticated users can insert team members" on team_members;
drop policy if exists "Admins can insert team members" on team_members;
create policy "Admins can insert team members" on team_members
  for insert to authenticated with check (is_admin());

drop policy if exists "Authenticated users can update team members" on team_members;
drop policy if exists "Admins can update team members" on team_members;
create policy "Admins can update team members" on team_members
  for update to authenticated using (is_admin());

drop policy if exists "Authenticated users can delete team members" on team_members;
drop policy if exists "Admins can delete team members" on team_members;
create policy "Admins can delete team members" on team_members
  for delete to authenticated using (is_admin());

-- ===========================================================
-- POLICIES — member_status
-- ===========================================================
-- You can see your own row; approved members and admins can see
-- everyone's (needed so the directory query can check "is this
-- profile's owner approved," and so admins can see the request queue).
drop policy if exists "Read own or approved-visible status" on member_status;
create policy "Read own or approved-visible status" on member_status
  for select using (id = auth.uid() or is_admin() or is_approved());

-- Signing up creates your own row, always starting unapproved and
-- non-admin — you cannot self-approve or self-promote at signup.
drop policy if exists "Self insert as pending" on member_status;
create policy "Self insert as pending" on member_status
  for insert with check (id = auth.uid() and approved = false and is_admin = false);

-- Only admins can approve/deny/promote.
drop policy if exists "Admins can update status" on member_status;
create policy "Admins can update status" on member_status
  for update using (is_admin()) with check (is_admin());

drop policy if exists "Admins can delete status" on member_status;
create policy "Admins can delete status" on member_status
  for delete using (is_admin());

-- ===========================================================
-- POLICIES — member_profiles
-- ===========================================================
-- You can always see your own profile (even pending). Everyone else's
-- profile is visible only if you're approved (or admin) AND that
-- profile's owner is approved.
drop policy if exists "Read own or directory-visible profiles" on member_profiles;
create policy "Read own or directory-visible profiles" on member_profiles
  for select using (
    id = auth.uid()
    or is_admin()
    or (is_approved() and is_approved_member(id))
  );

drop policy if exists "Self insert own profile" on member_profiles;
create policy "Self insert own profile" on member_profiles
  for insert with check (id = auth.uid());

drop policy if exists "Self or admin update profile" on member_profiles;
create policy "Self or admin update profile" on member_profiles
  for update using (id = auth.uid() or is_admin()) with check (id = auth.uid() or is_admin());

drop policy if exists "Self or admin delete profile" on member_profiles;
create policy "Self or admin delete profile" on member_profiles
  for delete using (id = auth.uid() or is_admin());

-- ===========================================================
-- BOOTSTRAP YOUR FIRST ADMIN (run this part manually, once)
-- ===========================================================
-- 1. Sign up for the directory on your live site (or locally) using
--    the account you want to be the first admin.
-- 2. Come back here and run (with your real email):
--
--    update member_status set approved = true, is_admin = true
--    where email = 'you@purdue.edu';
--
-- After that, use the "Member Requests" tab in /admin/dashboard.html
-- to approve everyone else and promote other officers to admin —
-- no more manual SQL needed.
