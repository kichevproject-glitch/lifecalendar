-- ============================================
-- LifeCalendar — Full Database Schema
-- Paste this in Supabase → SQL Editor → Run
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. CATEGORIES
-- Each user can create custom categories
-- (e.g. Work, Sport, Travel, Personal)
-- ============================================
create table categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null default '#6C63FF',   -- hex color for UI
  icon text not null default '📌',          -- emoji icon
  type text not null default 'event'        -- 'event' | 'task' | 'reminder'
    check (type in ('event', 'task', 'reminder')),
  created_at timestamptz default now()
);

-- ============================================
-- 2. EVENTS
-- Core calendar entries
-- ============================================
create table events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  calendar_id uuid,                          -- FK added after calendars table
  category_id uuid references categories(id) on delete set null,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  all_day boolean default false,
  location text,
  is_holiday boolean default false,          -- auto-populated holidays
  recurrence text,                           -- 'daily'|'weekly'|'monthly'|'yearly'|null
  recurrence_end date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 3. TASKS
-- To-do items linked to dates or events
-- ============================================
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  event_id uuid references events(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  title text not null,
  description text,
  due_date date,
  completed boolean default false,
  completed_at timestamptz,
  priority text default 'medium'
    check (priority in ('low', 'medium', 'high')),
  created_at timestamptz default now()
);

-- ============================================
-- 4. PHOTOS
-- Images attached to events or specific dates
-- ============================================
create table photos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  event_id uuid references events(id) on delete cascade,
  date date,                                 -- can be attached to a date without event
  storage_path text not null,                -- Supabase Storage path
  caption text,
  created_at timestamptz default now()
);

-- ============================================
-- 5. SHARED CALENDARS
-- Share your calendar with other people
-- ============================================
create table shared_calendars (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null default 'My Calendar',
  description text,
  created_at timestamptz default now()
);

-- Add FK from events to calendars
alter table events
  add constraint events_calendar_id_fkey
  foreign key (calendar_id) references shared_calendars(id) on delete set null;

-- ============================================
-- 6. CALENDAR MEMBERS
-- People invited to a shared calendar
-- ============================================
create table calendar_members (
  id uuid primary key default uuid_generate_v4(),
  calendar_id uuid references shared_calendars(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  invited_email text,                        -- for pending invites (user not yet registered)
  role text not null default 'viewer'
    check (role in ('viewer', 'editor')),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  invited_at timestamptz default now(),
  accepted_at timestamptz
);

-- ============================================
-- 7. HOLIDAYS CACHE
-- Auto-populated from Calendarific API
-- ============================================
create table holidays (
  id uuid primary key default uuid_generate_v4(),
  country_code text not null default 'BG',
  year int not null,
  date date not null,
  name text not null,
  name_bg text,                              -- Bulgarian name
  type text,                                 -- 'national'|'observance' etc.
  unique(country_code, year, date, name)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Users can only see their own data
-- ============================================
alter table categories enable row level security;
alter table events enable row level security;
alter table tasks enable row level security;
alter table photos enable row level security;
alter table shared_calendars enable row level security;
alter table calendar_members enable row level security;

-- Categories: own data only
create policy "Users manage own categories"
  on categories for all using (auth.uid() = user_id);

-- Events: own events OR events in shared calendars they're a member of
create policy "Users manage own events"
  on events for all using (auth.uid() = user_id);

create policy "Members can view shared events"
  on events for select using (
    calendar_id in (
      select calendar_id from calendar_members
      where user_id = auth.uid() and status = 'accepted'
    )
  );

-- Tasks: own data only
create policy "Users manage own tasks"
  on tasks for all using (auth.uid() = user_id);

-- Photos: own data only
create policy "Users manage own photos"
  on photos for all using (auth.uid() = user_id);

-- Shared calendars: owner access
create policy "Owners manage their calendars"
  on shared_calendars for all using (auth.uid() = owner_id);

-- Calendar members: owners can manage, members can view their own row
create policy "Owners manage members"
  on calendar_members for all using (
    calendar_id in (
      select id from shared_calendars where owner_id = auth.uid()
    )
  );

create policy "Members can view their own invitation"
  on calendar_members for select using (auth.uid() = user_id);

-- Holidays: readable by all authenticated users
alter table holidays enable row level security;
create policy "Authenticated users can read holidays"
  on holidays for select using (auth.role() = 'authenticated');

-- ============================================
-- DEFAULT CATEGORIES (inserted after auth)
-- Call this function after user registers
-- ============================================
create or replace function create_default_categories()
returns trigger as $$
begin
  insert into categories (user_id, name, color, icon, type) values
    (new.id, 'Work',      '#3B82F6', '💼', 'event'),
    (new.id, 'Sport',     '#10B981', '🏃', 'event'),
    (new.id, 'Travel',    '#F59E0B', '✈️', 'event'),
    (new.id, 'Personal',  '#EC4899', '🌸', 'event'),
    (new.id, 'Family',    '#8B5CF6', '👨‍👩‍👧', 'event'),
    (new.id, 'Health',    '#EF4444', '❤️', 'event'),
    (new.id, 'Nature',    '#84CC16', '🌿', 'event'),
    (new.id, 'Task',      '#6B7280', '✅', 'task');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: auto-create default categories on new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure create_default_categories();

-- ============================================
-- DONE! Your schema is ready.
-- ============================================
