-- ============================================================
-- ATI DASHBOARD — SUPABASE SCHEMA
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. PROJECTS
create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  token       text not null unique default encode(gen_random_bytes(32), 'hex'),
  description text,
  created_at  timestamptz default now()
);

-- 2. RUNS (each ATI.start() call creates one row)
create table if not exists runs (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects(id) on delete cascade,
  source       text not null check (source in ('local','cicd')),
  status       text not null default 'running' check (status in ('running','completed','aborted')),
  environment  text default 'QA',
  browser      text,
  os           text,
  branch       text,
  triggered_by text,
  total_tests  int default 0,
  passed       int default 0,
  failed       int default 0,
  skipped      int default 0,
  duration_ms  bigint,
  started_at   timestamptz default now(),
  ended_at     timestamptz
);

-- 3. TEST RESULTS (one row per test per run)
create table if not exists test_results (
  id             uuid primary key default gen_random_uuid(),
  run_id         uuid references runs(id) on delete cascade,
  project_id     uuid references projects(id) on delete cascade,
  test_name      text not null,
  module         text,
  status         text not null check (status in ('passed','failed','skipped','flaky')),
  duration_ms    int,
  retry_count    int default 0,
  error_message  text,
  stack_trace    text,
  screenshot_url text,
  failure_category text check (failure_category in (
    'assertion','timeout','element_not_found','network','product_bug','flaky','other'
  )),
  source         text,
  browser        text,
  os             text,
  executed_at    timestamptz default now()
);

-- 4. API TEST RESULTS
create table if not exists api_test_results (
  id           uuid primary key default gen_random_uuid(),
  run_id       uuid references runs(id) on delete cascade,
  project_id   uuid references projects(id) on delete cascade,
  test_name    text not null,
  endpoint     text not null,
  method       text not null,
  status_code  int,
  duration_ms  int,
  passed       boolean default false,
  assertion    text,
  request_body text,
  response_body text,
  error_message text,
  source       text,
  executed_at  timestamptz default now()
);

-- 5. BUGS
create table if not exists bugs (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects(id) on delete cascade,
  run_id       uuid references runs(id),
  test_id      uuid references test_results(id),
  title        text not null,
  description  text,
  severity     text check (severity in ('P1','P2','P3','P4')),
  priority     text check (priority in ('critical','high','medium','low')),
  status       text default 'open' check (status in ('open','in_review','resolved','closed','reopened')),
  jira_id      text,
  assigned_to  text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- 6. DEV ISSUES (kanban board)
create table if not exists dev_issues (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects(id) on delete cascade,
  run_id       uuid references runs(id),
  test_id      uuid references test_results(id),
  test_name    text not null,
  module       text,
  status       text default 'new_failure' check (status in (
    'new_failure','investigation','rerun_required','not_a_bug','resolved'
  )),
  priority     text check (priority in ('P1','P2','P3','P4')),
  assignee     text,
  note         text,
  reason       text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- 7. MEMBERS + TIME LOGS
create table if not exists members (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name       text not null,
  initials   text not null,
  modules    text[] default '{}',
  color      text default 'blue',
  created_at timestamptz default now()
);

create table if not exists time_logs (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid references members(id) on delete cascade,
  project_id uuid references projects(id),
  sprint     text,
  activity   text check (activity in (
    'writing_tests','investigating_failures','fixing_flaky',
    'framework_maintenance','code_review','documentation','meetings'
  )),
  hours      numeric(5,2),
  logged_at  timestamptz default now()
);

-- 8. CALL SETUP
create table if not exists calls (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects(id) on delete cascade,
  title        text not null,
  call_type    text check (call_type in ('incident','sync','review','planning','handoff')),
  status       text default 'scheduled' check (status in ('live','scheduled','completed')),
  platform     text,
  participants text[] default '{}',
  notes        text,
  scheduled_at timestamptz,
  started_at   timestamptz,
  ended_at     timestamptz,
  created_at   timestamptz default now()
);

-- ============================================================
-- INDEXES for fast dashboard queries
-- ============================================================
create index if not exists idx_runs_project_source    on runs(project_id, source);
create index if not exists idx_runs_started_at        on runs(started_at desc);
create index if not exists idx_test_results_run       on test_results(run_id);
create index if not exists idx_test_results_project   on test_results(project_id);
create index if not exists idx_test_results_status    on test_results(status);
create index if not exists idx_api_test_run           on api_test_results(run_id);
create index if not exists idx_dev_issues_project     on dev_issues(project_id, status);
create index if not exists idx_bugs_project_status    on bugs(project_id, status);

-- ============================================================
-- SEED: default project (copy the token for your SDK config)
-- ============================================================
insert into projects (name, description) values
  ('ecommerce-project', 'E-Commerce Platform — Selenium + Playwright suite')
on conflict (name) do nothing;

-- Show the generated token — save this as ATI_TOKEN in your env
select name, token from projects where name = 'ecommerce-project';
