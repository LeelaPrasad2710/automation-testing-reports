-- ============================================================
-- SUPABASE REALTIME SETUP
-- Run this in Supabase → SQL Editor after running supabase_schema.sql
-- Enables live dashboard updates — replaces Socket.io completely
-- ============================================================

-- Enable Realtime on all tables the dashboard subscribes to
alter publication supabase_realtime add table runs;
alter publication supabase_realtime add table test_results;
alter publication supabase_realtime add table api_test_results;
alter publication supabase_realtime add table dev_issues;
alter publication supabase_realtime add table bugs;
alter publication supabase_realtime add table calls;
alter publication supabase_realtime add table members;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Protects data — anon key can only read, service key can write
-- ============================================================

-- Enable RLS on all tables
alter table projects         enable row level security;
alter table runs             enable row level security;
alter table test_results     enable row level security;
alter table api_test_results enable row level security;
alter table bugs             enable row level security;
alter table dev_issues       enable row level security;
alter table members          enable row level security;
alter table time_logs        enable row level security;
alter table calls            enable row level security;

-- Allow anon (frontend) to READ all rows
-- The service key (backend) bypasses RLS entirely — no policy needed for it
create policy "anon can read runs"
  on runs for select to anon using (true);

create policy "anon can read test_results"
  on test_results for select to anon using (true);

create policy "anon can read api_test_results"
  on api_test_results for select to anon using (true);

create policy "anon can read bugs"
  on bugs for select to anon using (true);

create policy "anon can read dev_issues"
  on dev_issues for select to anon using (true);

create policy "anon can read members"
  on members for select to anon using (true);

create policy "anon can read time_logs"
  on time_logs for select to anon using (true);

create policy "anon can read calls"
  on calls for select to anon using (true);

create policy "anon can read projects"
  on projects for select to anon using (true);

-- ============================================================
-- Verify Realtime is enabled
-- ============================================================
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
order by tablename;
-- Should show: runs, test_results, api_test_results, dev_issues, bugs, calls, members
