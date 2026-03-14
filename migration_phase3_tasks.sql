-- ============================================================
-- Phase 3 Migration — Tasks
-- Run in Supabase SQL Editor after deploying
-- ============================================================
alter table tasks
  add column if not exists reminder_minutes integer default null
    check (reminder_minutes in (60, 180, 1440));
alter table tasks
  add column if not exists reminder_sent boolean default false;