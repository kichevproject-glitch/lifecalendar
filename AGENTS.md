# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Dayflow (internally "LifeCalendar") is a personal interactive calendar app with categories, photo attachments, sharing, and planned AI analytics. Built with React + Vite, backed by Supabase (database, auth, storage), deployed on Vercel.

## Commands

All commands run from the the project root:

- **Dev server:** `npm run dev` (Vite dev server with HMR)
- **Build:** `npm run build` (production build via Vite)
- **Preview:** `npm run preview` (serve production build locally)

There is no test runner, linter, or formatter configured in this project.

## Environment Setup

Copy `lifecalendar/.env.example` to `lifecalendar/.env` and fill in:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key

These are accessed via `import.meta.env` (Vite convention).

## Architecture

### Frontend (src/)

Single-page React app using `react-router-dom` (BrowserRouter) but currently routing is handled via `activeView` state in `App.jsx`, not URL routes.

**Entry flow:** `main.jsx` → `App.jsx` wraps everything in `AuthProvider` → `AppInner` checks auth state and renders either `AuthPage` or the main layout (Sidebar + active view).

**Views** are selected by the Sidebar via `activeView` state:
- `calendar` — `CalendarGrid` (fully implemented, month grid with events and Bulgarian holidays)
- `tasks` — `TasksView` (placeholder, Phase 3)
- `analytics` — `AnalyticsView` (placeholder, Phase 4)
- `shared` — `SharedView` (placeholder, Phase 3)

### Data Layer (src/hooks/)

All Supabase interaction is encapsulated in custom hooks that manage local state + CRUD:
- `useAuth` — Context-based auth provider wrapping Supabase Auth (email/password sign-in/sign-up)
- `useEvents(year, month)` — Fetches events for a given month, returns CRUD functions. Events are joined with `categories` via Supabase relational query.
- `useCategories()` — User's custom categories with CRUD. Categories have `name`, `color` (hex), `icon` (emoji), and `type` (event/task/reminder).
- `useHolidays(year)` — Bulgarian public holidays, cached in Supabase `holidays` table with hardcoded fallback.

The single Supabase client is initialized in `src/lib/supabase.js`.

### Database Schema (lifecalendar-schema.sql)

The SQL schema lives at the repo root. Key tables: `categories`, `events`, `tasks`, `photos`, `shared_calendars`, `calendar_members`, `holidays`. All user-owned tables use Row Level Security (RLS) scoped to `auth.uid()`. A database trigger (`on_auth_user_created`) auto-creates default categories for new users.

### Styling

- All styling is inline JS objects (no CSS modules or styled-components).
- Global CSS variables for theming are defined in `src/styles/index.css` with dark (default) and light (`:root.light`) themes.
- Theme toggle is managed via `localStorage` key `lc-theme` and a class toggle on `document.documentElement`.
- Font: Montserrat (loaded from Google Fonts in `index.html`).

## Key Patterns

- Supabase queries use `.select('*, categories(id, name, color, icon)')` for relational joins on events.
- Hooks return `{ data, loading, ...crudFunctions, refetch }` consistently.
- All dates use `date-fns` for manipulation; calendar week starts on Monday (`weekStartsOn: 1`).
- The holidays system is Bulgaria-specific (country code `BG`).
