import { useState } from 'react'
import { Card, CardTitle, PageHeader, Badge, SectionTitle } from '../components/UI'

// Syntax highlight helpers — match HTML design colors
const Str = ({c}) => <span style={{color:'#3B6D11'}}>{c}</span>
const Kw  = ({c}) => <span style={{color:'#185FA5'}}>{c}</span>
const Fn  = ({c}) => <span style={{color:'#7F77DD'}}>{c}</span>
const Cmt = ({c}) => <span style={{color:'#888780'}}>{c}</span>

const codeBlockStyle = {
  background:'#f8f8f8',
  border:'0.5px solid #e5e5e5',
  borderRadius:'6px',
  padding:'10px 12px',
  fontFamily:'monospace',
  fontSize:'10px',
  lineHeight:1.7,
  whiteSpace:'pre',
  overflowX:'auto',
  maxHeight:'280px'
}

const TABS = ['Java', 'Playwright JS', 'Python', 'curl']
const CICD_TABS = ['GitHub Actions', 'Jenkins']

export default function IntegrationSetup() {
  const [activeTab,     setActiveTab]     = useState('Java')
  const [activeCicdTab, setActiveCicdTab] = useState('GitHub Actions')

  return (
    <div className="p-4">
      <PageHeader title="Integration setup" sub="Connect your test project to ATI Dashboard in minutes">
        <Badge color="green">3 lines minimum</Badge>
      </PageHeader>

      {/* How it works */}
      <div className="mb-4 rounded-xl p-4" style={{background:'#E6F1FB', border:'0.5px solid #85B7EB'}}>
        <div className="text-xs font-medium mb-2" style={{color:'#185FA5'}}>How it works — 4 steps</div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { n:'1', title:'Create project',  sub:'Run Supabase SQL — get your ATI_TOKEN from the projects table' },
            { n:'2', title:'Deploy to Vercel',sub:'Push to GitHub, import to Vercel, add 5 env vars' },
            { n:'3', title:'Add to project',  sub:'3 lines in your BaseTest — set ATI_URL, ATI_TOKEN env vars' },
            { n:'4', title:'Run tests',       sub:'Dashboard updates live. Local and CI/CD shown separately.' },
          ].map(s => (
            <div key={s.n} className="flex gap-2.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 mt-0.5"
                style={{background:'#B5D4F4', color:'#185FA5'}}>{s.n}</div>
              <div>
                <div className="text-[11px] font-medium" style={{color:'#185FA5'}}>{s.title}</div>
                <div className="text-[10px] mt-0.5 leading-tight" style={{color:'#378ADD'}}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Java/Playwright/Python/curl */}
        <Card>
          <CardTitle sub="Copy into BaseTest.java">Java / Selenium / TestNG setup</CardTitle>
          {/* Tabs: Java, Playwright JS, Python, curl — matching HTML */}
          <div className="flex gap-0 mb-3 border-b border-gray-100">
            {TABS.map(t => (
              <button key={t} onClick={()=>setActiveTab(t)}
                className={`text-[11px] px-3 py-1.5 border-b-2 transition-colors ${
                  activeTab===t ? 'border-blue-500 text-gray-900 font-medium' : 'border-transparent text-gray-400'
                }`}>{t}</button>
            ))}
          </div>

          {activeTab === 'Java' && (
            <>
              <div style={codeBlockStyle}>
<Cmt c="// 1. Add to pom.xml — one dependency" />
{`
`}<Cmt c="// <dependency>com.ati/ati-sdk/1.0</dependency>" />
{`

`}<Cmt c="// 2. Drop into your @BeforeSuite" />
{`
`}<Kw c="import" />{` com.ati.ATIDashboard;

`}<Fn c="@BeforeSuite" />
{`
`}<Kw c="public void" />{` setUp() {
  ATIDashboard.`}<Fn c="start" />{`(`}<Str c={'"ecommerce-project"'} />{`, `}<Str c={'"local"'} />{`);
}

`}<Fn c="@AfterMethod" />{`(alwaysRun = `}<Kw c="true" />{`)
`}<Kw c="public void" />{` afterTest(ITestResult result) {
  ATIDashboard.`}<Fn c="recordResult" />{`(result);
}

`}<Fn c="@AfterSuite" />
{`
`}<Kw c="public void" />{` tearDown() {
  ATIDashboard.`}<Fn c="stop" />{`();
}`}
              </div>
              {/* Blue info box — matches HTML exactly */}
              <div className="mt-2 rounded-lg p-2.5" style={{background:'var(--color-background-info,#E6F1FB)', border:'0.5px solid #B5D4F4'}}>
                <div className="text-[10px] font-medium mb-1" style={{color:'#185FA5'}}>That's it. Everything else is automatic.</div>
                <div className="text-[10px]" style={{color:'#378ADD'}}>
                  SDK captures test results, timings, retries, screenshots on fail, and pushes live to dashboard via Supabase Realtime.
                </div>
              </div>
            </>
          )}

          {activeTab === 'Playwright JS' && (
            <div style={codeBlockStyle}>
<Cmt c="// playwright.config.js" />
{`
`}<Kw c="import" />{` { defineConfig } `}<Kw c="from" />{` `}<Str c={"'@playwright/test'"} />{`;

`}<Kw c="export default" />{` defineConfig({
  reporter: [
    [`}<Str c={"'list'"} />{`],
    [`}<Str c={"'./ati-sdk.js'"} />{`]  `}<Cmt c="// ← add this line only" />
{`  ],
  use: { screenshot: `}<Str c={"'only-on-failure'"} />{` }
});`}
{`

`}<Cmt c="# Set env vars, then run normally:" />
{`
`}<Cmt c="# ATI_URL=https://your-project.vercel.app" />
{`
`}<Cmt c="# ATI_TOKEN=your-token ATI_SOURCE=local" />
{`
`}<Cmt c="# npx playwright test" />
            </div>
          )}

          {activeTab === 'Python' && (
            <div style={codeBlockStyle}>
<Cmt c="# pip install requests" />
{`
`}<Kw c="import" />{` requests, os

ATI_URL   = os.getenv(`}<Str c={"'ATI_URL'"} />{`, `}<Str c={"'https://your-project.vercel.app'"} />{`)
ATI_TOKEN = os.getenv(`}<Str c={"'ATI_TOKEN'"} />{`, `}<Str c={"''"} />{`)
HEADERS   = {`}<Str c={"'Authorization'"} />{`: `}<Str c={"f'Bearer {ATI_TOKEN}'"} />{`}

run_id = `}<Kw c="None" />
{`

`}<Kw c="def" />{` `}<Fn c="ati_start" />{`(project, source=`}<Str c={"'local'"} />{`):
    `}<Kw c="global" />{` run_id
    r = requests.post(
        f`}<Str c={"'{ATI_URL}/api/runs?action=start'"} />{`,
        json={`}<Str c={"'source'"} />{`: source},
        headers=HEADERS
    )
    run_id = r.json().get(`}<Str c={"'runId'"} />{`)

`}<Kw c="def" />{` `}<Fn c="ati_result" />{`(name, module, status, duration_ms):
    requests.post(f`}<Str c={"'{ATI_URL}/api/tests'"} />{`,
        json={`}<Str c={"'runId'"} />{`: run_id, `}<Str c={"'testName'"} />{`: name,
              `}<Str c={"'module'"} />{`: module, `}<Str c={"'status'"} />{`: status,
              `}<Str c={"'durationMs'"} />{`: duration_ms},
        headers=HEADERS)

`}<Kw c="def" />{` `}<Fn c="ati_stop" />{`():
    requests.post(f`}<Str c={"'{ATI_URL}/api/runs?action=stop'"} />{`,
        json={`}<Str c={"'runId'"} />{`: run_id}, headers=HEADERS)`}
            </div>
          )}

          {activeTab === 'curl' && (
            <div style={codeBlockStyle}>
<Cmt c="# 1. Start a run" />
{`
curl -X POST https://your-project.vercel.app/api/runs?action=start \\
  -H `}<Str c={'"Content-Type: application/json"'} />{` \\
  -H `}<Str c={'"Authorization: Bearer YOUR_TOKEN"'} />{` \\
  -d `}<Str c={"'{\"source\":\"local\",\"environment\":\"QA\"}'"} />{`

`}<Cmt c='# → {"success":true,"runId":"uuid-here"}' />
{`

`}<Cmt c="# 2. Push a test result" />
{`
curl -X POST https://your-project.vercel.app/api/tests \\
  -H `}<Str c={'"Authorization: Bearer YOUR_TOKEN"'} />{` \\
  -H `}<Str c={'"Content-Type: application/json"'} />{` \\
  -d `}<Str c={"'{\"runId\":\"uuid\",\"testName\":\"test_login\",\"status\":\"passed\",\"durationMs\":1200}'"} />{`

`}<Cmt c="# 3. Stop the run" />
{`
curl -X POST https://your-project.vercel.app/api/runs?action=stop \\
  -H `}<Str c={'"Authorization: Bearer YOUR_TOKEN"'} />{` \\
  -H `}<Str c={'"Content-Type: application/json"'} />{` \\
  -d `}<Str c={"'{\"runId\":\"uuid\",\"passed\":10,\"failed\":0,\"skipped\":0}'"} />
            </div>
          )}
        </Card>

        {/* GitHub Actions / Jenkins */}
        <Card>
          <CardTitle sub="GitHub Actions / Jenkins">CI/CD pipeline setup</CardTitle>
          <div className="flex gap-0 mb-3 border-b border-gray-100">
            {CICD_TABS.map(t => (
              <button key={t} onClick={()=>setActiveCicdTab(t)}
                className={`text-[11px] px-3 py-1.5 border-b-2 transition-colors ${
                  activeCicdTab===t ? 'border-blue-500 text-gray-900 font-medium' : 'border-transparent text-gray-400'
                }`}>{t}</button>
            ))}
          </div>

          {activeCicdTab === 'GitHub Actions' && (
            <>
              <div style={codeBlockStyle}>
<Cmt c="# .github/workflows/regression.yml" />
{`
- name: Run ATI tests
  env:
    ATI_PROJECT: `}<Str c="ecommerce-project" />
{`
    ATI_SOURCE: `}<Str c="cicd" />
{`
    ATI_TOKEN: `}<Str c="${{ secrets.ATI_TOKEN }}" />
{`
    ATI_URL: `}<Str c="https://your-project.vercel.app" />
{`
  run: mvn test

`}<Cmt c="# SDK reads env vars automatically." />
{`
`}<Cmt c="# source=cicd → routes to CI/CD dashboard." />
{`
`}<Cmt c="# source=local → routes to Local dashboard." />
              </div>
              <div className="mt-2 text-[10px] text-gray-500">
                The <code className="bg-gray-100 px-1 rounded text-[10px]">ATI_SOURCE</code> env var is the only difference between local and CI/CD. Same code, two separate live dashboards.
              </div>
            </>
          )}

          {activeCicdTab === 'Jenkins' && (
            <div style={codeBlockStyle}>
<Cmt c="// Jenkinsfile" />
{`
pipeline {
    agent any
    environment {
        ATI_URL    = credentials(`}<Str c={"'ati-url'"} />{`)
        ATI_TOKEN  = credentials(`}<Str c={"'ati-token'"} />{`)
        ATI_SOURCE = `}<Str c={"'cicd'"} />
{`
        ATI_PROJECT= `}<Str c={"'ecommerce-project'"} />
{`
    }
    stages {
        stage(`}<Str c={"'Test'"} />{`) {
            steps { sh `}<Str c={"'mvn test'"} />{` }
        }
    }
}`}
            </div>
          )}
        </Card>
      </div>

      {/* Env vars reference */}
      <SectionTitle>Environment variables reference</SectionTitle>
      <Card>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-[10px] text-gray-400 border-b border-gray-100">
              <th className="text-left pb-2">Variable</th>
              <th className="text-left pb-2">Required</th>
              <th className="text-left pb-2">Example</th>
              <th className="text-left pb-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {[
              { v:'ATI_URL',     req:true,  ex:'https://your-project.vercel.app', note:'Your Vercel deployment URL' },
              { v:'ATI_TOKEN',   req:true,  ex:'a3f9c2d1...',                     note:'From Supabase projects table' },
              { v:'ATI_PROJECT', req:false, ex:'ecommerce-project',               note:'Defaults to "default"' },
              { v:'ATI_SOURCE',  req:false, ex:'local | cicd',                    note:'Which dashboard tab gets the data' },
              { v:'ATI_ENV',     req:false, ex:'QA | UAT | Prod',                 note:'Environment label' },
              { v:'ATI_BROWSER', req:false, ex:'Chrome | Firefox',                note:'Browser label for display' },
            ].map(row => (
              <tr key={row.v} className="border-b border-gray-50 last:border-none">
                <td className="py-2 font-mono text-[10px] text-blue-700">{row.v}</td>
                <td className="py-2"><span className={`text-[10px] font-medium ${row.req?'text-red-600':'text-gray-400'}`}>{row.req?'Required':'Optional'}</span></td>
                <td className="py-2 font-mono text-[10px] text-gray-600">{row.ex}</td>
                <td className="py-2 text-gray-500">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
