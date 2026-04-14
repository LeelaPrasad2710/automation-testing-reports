# ATI Dashboard — 100% Vercel + Supabase (No Railway)

Everything on Vercel. Zero paid services. Total cost: ₹0/month.

## Why this works

| What you need      | Old approach      | New approach        |
|--------------------|-------------------|---------------------|
| REST API           | Express on Railway | Vercel serverless functions |
| Live updates       | Socket.io server   | Supabase Realtime (built-in, free) |
| Database           | Supabase           | Same Supabase |
| Frontend           | Vercel             | Same Vercel |
| Monthly cost       | ~₹40              | ₹0 |

Supabase Realtime watches the database directly. When your SDK inserts a
test result, Supabase broadcasts that row to every subscribed dashboard
client instantly. No WebSocket server needed.

---

## Setup — 15 minutes

### Step 1 — Supabase

1. [supabase.com](https://supabase.com) → New project → free tier
2. SQL Editor → paste and run `supabase_schema.sql`
3. SQL Editor → paste and run `supabase_realtime_setup.sql`
4. Save from **Settings → API**:
   - `Project URL`         → `SUPABASE_URL` + `VITE_SUPABASE_URL`
   - `anon` public key     → `VITE_SUPABASE_ANON_KEY`
   - `service_role` secret → `SUPABASE_SERVICE_KEY`
5. Get your project token:
   ```sql
   select name, token from projects where name = 'ecommerce-project';
   ```
   Save this as `VITE_ATI_TOKEN`

---

### Step 2 — Supabase Storage bucket

1. Supabase → Storage → New bucket
2. Name: `screenshots`
3. Toggle: **Public bucket** ✓
4. Save

---

### Step 3 — Deploy to Vercel

1. Push this repo to GitHub
2. [vercel.com](https://vercel.com) → New Project → Import repo
3. **Root Directory**: leave as `/` (root — NOT frontend/)
4. Add **all** environment variables:

   | Variable               | Value                              | Where used |
   |------------------------|------------------------------------|------------|
   | `SUPABASE_URL`         | https://xxx.supabase.co            | API functions |
   | `SUPABASE_SERVICE_KEY` | your service_role key              | API functions |
   | `VITE_SUPABASE_URL`    | https://xxx.supabase.co            | Frontend |
   | `VITE_SUPABASE_ANON_KEY` | your anon key                    | Frontend |
   | `VITE_ATI_TOKEN`       | token from projects table          | Frontend |

5. Deploy → your URL: `https://your-project.vercel.app`

---

### Step 4 — Connect your test project

Copy `sdk/ATIDashboard.java` into your project. Set env vars:

```
ATI_URL    = https://your-project.vercel.app
ATI_TOKEN  = your-token-from-step-1
ATI_SOURCE = local
```

Add to `BaseTest.java`:
```java
@BeforeSuite(alwaysRun = true)
public void setUp() {
    ATIDashboard.start("ecommerce-project", "local");
}

@AfterMethod(alwaysRun = true)
public void afterTest(ITestResult result) {
    ATIDashboard.recordResult(result);
}

@AfterSuite(alwaysRun = true)
public void tearDown() {
    ATIDashboard.stop();
}
```

Open `https://your-project.vercel.app` → run tests → watch it update live.

---

### Step 5 — GitHub Actions (CI/CD)

```yaml
- name: Run tests
  env:
    ATI_URL:    ${{ secrets.ATI_URL }}      # your Vercel URL
    ATI_TOKEN:  ${{ secrets.ATI_TOKEN }}
    ATI_SOURCE: cicd
  run: mvn test
```

In the dashboard, click **CI/CD** in the sidebar to see pipeline results
separately from local runs.

---

## Project structure

```
ati-dashboard/
├── vercel.json                   ← Routes /api/* to functions, rest to React
├── package.json                  ← Root deps (just @supabase/supabase-js)
├── .env.example                  ← Vercel function env vars
├── supabase_schema.sql           ← Run once in Supabase SQL Editor
├── supabase_realtime_setup.sql   ← Run once — enables live updates + RLS
│
├── api/                          ← Vercel serverless functions
│   ├── health.js
│   ├── run/
│   │   ├── start.js              ← POST — called by ATI.start()
│   │   ├── stop.js               ← POST — called by ATI.stop()
│   │   └── list.js               ← GET  — dashboard fetches runs
│   ├── test/
│   │   ├── result.js             ← POST — called per test
│   │   └── results.js            ← GET  — dashboard fetches results
│   ├── api-test/
│   │   ├── result.js             ← POST — API test result
│   │   └── results.js            ← GET
│   ├── dev-issue/
│   │   ├── list.js
│   │   └── update.js
│   ├── bug/
│   │   ├── list.js
│   │   └── create.js
│   ├── project/summary.js
│   ├── call/
│   │   ├── list.js
│   │   ├── create.js
│   │   └── update.js
│   └── member/
│       ├── list.js
│       └── timelog.js
│
├── lib/                          ← Shared helpers for API functions
│   ├── supabase.js               ← Supabase client (service key)
│   └── auth.js                   ← Token auth middleware
│
├── frontend/                     ← React app
│   ├── .env.example
│   ├── package.json              ← No socket.io — uses @supabase/supabase-js
│   └── src/
│       ├── hooks/
│       │   ├── useRealtime.js    ← Supabase Realtime (replaces Socket.io)
│       │   └── useLiveRun.js     ← Live run state hook
│       ├── api/index.js          ← Axios client → /api/* endpoints
│       └── pages/ components/    ← All UI (same as before)
│
└── sdk/
    ├── ATIDashboard.java         ← Java SDK → calls Vercel /api/* endpoints
    └── ati-sdk.js                ← Playwright JS SDK
```

---

## How live updates work (no Socket.io)

```
Your test runs
    ↓
ATIDashboard.recordResult()  ← runs after every test
    ↓
POST https://your-project.vercel.app/api/test/result
    ↓
Vercel serverless function writes row to Supabase
    ↓
Supabase Realtime detects the INSERT
    ↓
Broadcasts to all subscribed dashboard clients (free, built-in)
    ↓
useRealtime.js receives event → updates React state
    ↓
Dashboard updates live — pass/fail counters, test list, charts
```

---

## Verify it's working

```bash
# 1. Check health endpoint
curl https://your-project.vercel.app/api/health
# Expected: {"status":"ok","version":"1.0.0"}

# 2. Check auth
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-project.vercel.app/api/project/summary
# Expected: {"project":{"name":"ecommerce-project",...},...}

# 3. Simulate a test run (from terminal)
curl -X POST https://your-project.vercel.app/api/run/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"source":"local","environment":"QA","browser":"Chrome","os":"macOS"}'
# Expected: {"success":true,"runId":"uuid-here"}
```

---

## Troubleshooting

**Realtime not working**
- Check Supabase → Database → Replication → confirm tables are listed
- Re-run `supabase_realtime_setup.sql`
- Check browser console for Supabase channel errors

**401 Unauthorized**
- Confirm `VITE_ATI_TOKEN` matches a token in the `projects` table
- In Supabase: `select name, token from projects;`

**Serverless function errors**
- Vercel Dashboard → your project → Functions tab → check logs
- Confirm `SUPABASE_SERVICE_KEY` is the service_role key (not anon)

**Screenshot upload failing**
- Supabase → Storage → confirm `screenshots` bucket exists and is **public**
