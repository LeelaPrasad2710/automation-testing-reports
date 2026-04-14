import { useEffect, useState } from 'react'
import { useProject } from '../App'
import { useLiveRun } from '../hooks/useLiveRun'
import { useRealtime } from '../hooks/useRealtime'
import { runAPI } from '../api'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  Card, CardTitle, MetricCard, PageHeader, SectionTitle,
  Badge, Pill, ProgressBar, LiveDot, EmptyState
} from '../components/UI'

// Syntax-highlighted code span helpers
const Str  = ({ v }) => <span style={{color:'#3B6D11'}}>{v}</span>
const Kw   = ({ v }) => <span style={{color:'#185FA5'}}>{v}</span>
const Cmt  = ({ v }) => <span style={{color:'#888780'}}>{v}</span>

export default function Overview() {
  const { projectName, projectId, source } = useProject()
  const { liveRun, liveTests, passRate } = useLiveRun(projectId, source)

  // Separate state for local and cicd latest runs — always shown side by side
  const [localRun,  setLocalRun]  = useState(null)
  const [cicdRun,   setCicdRun]   = useState(null)
  const [runs,      setRuns]      = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    // Fetch both local and cicd latest runs
    Promise.all([
      runAPI.list('local', 1),
      runAPI.list('cicd',  1),
      runAPI.list(source, 10),
    ]).then(([local, cicd, all]) => {
      setLocalRun(local?.[0] || null)
      setCicdRun(cicd?.[0]  || null)
      setRuns(all || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [projectName, source])

  useRealtime(projectId, source, {
    onRunChange: (run) => {
      if (run.source === 'local') setLocalRun(run)
      if (run.source === 'cicd')  setCicdRun(run)
      runAPI.list(source, 10).then(setRuns)
    }
  })

  const trendData = runs.slice().reverse().map((r, i) => ({
    name: `#${i + 1}`,
    pass: r.total_tests > 0 ? Math.round((r.passed / r.total_tests) * 100) : 0,
    fail: r.total_tests > 0 ? Math.round((r.failed / r.total_tests) * 100) : 0,
    time: r.duration_ms ? Math.round(r.duration_ms / 60000 * 10) / 10 : 0
  }))

  const latest     = runs[0]
  const totalPassed = latest?.passed  || 0
  const totalFailed = latest?.failed  || 0
  const totalSkip   = latest?.skipped || 0
  const totalAll    = totalPassed + totalFailed + totalSkip
  const latestRate  = totalAll > 0 ? ((totalPassed / totalAll) * 100).toFixed(1) : '—'

  const donutData = [
    { name: 'Passed',  value: totalPassed, color: '#639922' },
    { name: 'Failed',  value: totalFailed, color: '#D85A30' },
    { name: 'Skipped', value: totalSkip,   color: '#BA7517' }
  ]

  // Helper: format seconds elapsed
  function elapsed(startedAt) {
    if (!startedAt) return '—'
    const secs = Math.floor((Date.now() - new Date(startedAt)) / 1000)
    const m = Math.floor(secs / 60), s = secs % 60
    return `${m}m ${s}s`
  }

  return (
    <div className="p-4">
      <PageHeader
        title="Automation Test Intelligence"
        sub={`${projectName} · Selenium + Playwright`}
      >
        <Badge color="blue">v4.0</Badge>
        {latest && <Badge color="green">Build #{runs.length}</Badge>}
        {(localRun?.status === 'running' || liveRun) && (
          <span className="text-[10px] text-gray-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />Live
          </span>
        )}
      </PageHeader>

      {/* ── Dual dashboard cards — always visible ── */}
      <SectionTitle live>Dual project dashboards — Local vs CI/CD</SectionTitle>
      <div className="grid grid-cols-2 gap-3 mb-3">

        {/* LOCAL run card */}
        <div className="bg-white border border-gray-100 rounded-xl p-3">
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg mb-3"
            style={{background:'#E1F5EE', border:'0.5px solid #5DCAA5'}}>
            <span className="w-2 h-2 rounded-full flex-shrink-0"
              style={{background:'#1D9E75', animation: localRun?.status==='running' ? 'pulse 1.4s ease-in-out infinite' : 'none'}} />
            <span className="text-[11px] font-medium" style={{color:'#085041'}}>
              {localRun?.status === 'running' ? 'Local run — in progress' : 'Local run — last completed'}
            </span>
            <span className="ml-auto text-[10px]" style={{color:'#0F6E56'}}>
              {localRun?.triggered_by || 'local machine'}
            </span>
          </div>
          {localRun ? (
            <>
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-[10px] text-gray-400">Run ID</div>
                  <div className="text-[13px] font-medium text-gray-900 truncate">{localRun.id?.slice(-6) || '—'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-[10px] text-gray-400">Started</div>
                  <div className="text-[13px] font-medium text-gray-900">
                    {localRun.started_at ? new Date(localRun.started_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '—'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-[10px] text-gray-400">Elapsed</div>
                  <div className="text-[13px] font-medium" style={{color:'#BA7517'}}>
                    {localRun.status === 'running' ? elapsed(localRun.started_at)
                      : localRun.duration_ms ? `${(localRun.duration_ms/60000).toFixed(1)}m` : '—'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-[10px] text-gray-400">Progress</div>
                  <div className="text-[13px] font-medium" style={{color:'#3B6D11'}}>
                    {localRun.total_tests > 0
                      ? `${Math.round(((localRun.passed+localRun.failed+localRun.skipped)/localRun.total_tests)*100)}%`
                      : localRun.status === 'completed' ? '100%' : '—'}
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                  <span>Tests: {(localRun.passed||0)+(localRun.failed||0)+(localRun.skipped||0)} / {localRun.total_tests || '?'}</span>
                  {localRun.status === 'running' && <span>Running…</span>}
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{
                    width: localRun.total_tests > 0
                      ? `${Math.round(((localRun.passed||0)+(localRun.failed||0)+(localRun.skipped||0))/localRun.total_tests*100)}%`
                      : localRun.status === 'completed' ? '100%' : '5%',
                    background: '#1D9E75'
                  }} />
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap mb-2">
                <Pill status="passed"  label={`${localRun.passed||0} passed`} />
                <Pill status="failed"  label={`${localRun.failed||0} failed`} />
                <Pill status="skipped" label={`${localRun.skipped||0} skipped`} />
                {liveRun && <Pill status="flaky"   label="live" />}
              </div>
              <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-2 mt-1">
                {localRun.browser && `Browser: ${localRun.browser} · `}
                {localRun.os && `OS: ${localRun.os} · `}
                Env: {localRun.environment || 'local'} · source=local
              </div>
            </>
          ) : (
            <div className="py-4 text-center text-[11px] text-gray-400">
              No local run yet — run <code className="bg-gray-100 px-1 rounded">ATIDashboard.start()</code>
            </div>
          )}
        </div>

        {/* CI/CD run card */}
        <div className="bg-white border border-gray-100 rounded-xl p-3">
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg mb-3"
            style={{background:'#E6F1FB', border:'0.5px solid #85B7EB'}}>
            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <span className="text-[11px] font-medium text-blue-700">
              {cicdRun?.status === 'running' ? 'CI/CD run — in progress' : 'CI/CD run — last completed'}
            </span>
            <span className="ml-auto text-[10px] text-blue-500">
              {cicdRun?.branch ? `branch: ${cicdRun.branch}` : 'GitHub Actions'}
            </span>
          </div>
          {cicdRun ? (
            <>
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-[10px] text-gray-400">Build #</div>
                  <div className="text-[13px] font-medium text-gray-900">{cicdRun.id?.slice(-4) || '—'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-[10px] text-gray-400">Triggered</div>
                  <div className="text-[13px] font-medium text-gray-900">
                    {cicdRun.started_at ? new Date(cicdRun.started_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '—'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-[10px] text-gray-400">Duration</div>
                  <div className="text-[13px] font-medium text-gray-900">
                    {cicdRun.duration_ms ? `${(cicdRun.duration_ms/60000).toFixed(1)}m` : '—'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-[10px] text-gray-400">Pass rate</div>
                  <div className="text-[13px] font-medium text-green-700">
                    {cicdRun.total_tests > 0 ? `${((cicdRun.passed/cicdRun.total_tests)*100).toFixed(1)}%` : '—'}
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                  <span>{cicdRun.total_tests || 0} tests completed</span>
                  {cicdRun.ended_at && (
                    <span>Finished {new Date(cicdRun.ended_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                  )}
                </div>
                {/* Timeline bar — pass / fail / skip segments */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex gap-px">
                  {cicdRun.total_tests > 0 && <>
                    <div style={{width:`${(cicdRun.passed/cicdRun.total_tests*100).toFixed(1)}%`, background:'#639922'}} className="h-full rounded-l" />
                    <div style={{width:`${(cicdRun.failed/cicdRun.total_tests*100).toFixed(1)}%`, background:'#D85A30'}} className="h-full" />
                    <div style={{width:`${(cicdRun.skipped/cicdRun.total_tests*100).toFixed(1)}%`, background:'#BA7517'}} className="h-full rounded-r" />
                  </>}
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap mb-2">
                <Pill status="passed"  label={`${cicdRun.passed||0} passed`} />
                <Pill status="failed"  label={`${cicdRun.failed||0} failed`} />
                <Pill status="skipped" label={`${cicdRun.skipped||0} skipped`} />
              </div>
              <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-2 mt-1">
                {cicdRun.browser && `Browser: ${cicdRun.browser} · `}
                {cicdRun.os && `OS: ${cicdRun.os} · `}
                Env: {cicdRun.environment || 'QA'} · source=cicd
              </div>
            </>
          ) : (
            <div className="py-4 text-center text-[11px] text-gray-400">
              No CI/CD run yet — set <code className="bg-gray-100 px-1 rounded">ATI_SOURCE=cicd</code> in pipeline
            </div>
          )}
        </div>
      </div>

      {/* ── Summary metrics ── */}
      <SectionTitle>Latest build summary</SectionTitle>
      <div className="grid grid-cols-5 gap-2 mb-3">
        <MetricCard label="Pass rate"   value={`${latestRate}%`} valueClass="text-green-700" sub="Latest build" />
        <MetricCard label="Fail rate"   value={totalAll > 0 ? `${((totalFailed/totalAll)*100).toFixed(1)}%` : '—'} valueClass="text-red-600" />
        <MetricCard label="Total tests" value={totalAll || '—'} />
        <MetricCard label="Duration"    value={latest?.duration_ms ? `${(latest.duration_ms/60000).toFixed(1)}m` : '—'} />
        <MetricCard label="Total runs"  value={runs.length} sub={`${source} source`} />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Card>
          <CardTitle sub="Last 10 builds">Pass / fail trend</CardTitle>
          <div className="flex gap-3 text-[10px] text-gray-500 mb-2">
            <span className="flex items-center gap-1"><span className="w-2 h-px bg-green-500 inline-block" /> Pass %</span>
            <span className="flex items-center gap-1"><span className="w-2 h-px bg-red-400 inline-block" /> Fail %</span>
          </div>
          <ResponsiveContainer width="100%" height={110}>
            <LineChart data={trendData}>
              <XAxis dataKey="name" tick={{fontSize:9}} />
              <YAxis tick={{fontSize:9}} domain={[0,100]} />
              <Tooltip contentStyle={{fontSize:10}} />
              <Line type="monotone" dataKey="pass" stroke="#639922" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="fail" stroke="#D85A30" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <CardTitle sub="Latest build">Status split</CardTitle>
          <div className="flex gap-3 text-[10px] text-gray-500 mb-1">
            {donutData.map(d => (
              <span key={d.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm inline-block" style={{background:d.color}} />
                {d.name} {d.value}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={110}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={28} outerRadius={48} dataKey="value">
                {donutData.map((d,i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{fontSize:10}} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <CardTitle sub="Minutes">Exec time trend</CardTitle>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={trendData}>
              <XAxis dataKey="name" tick={{fontSize:9}} />
              <YAxis tick={{fontSize:9}} />
              <Tooltip contentStyle={{fontSize:10}} />
              <Bar dataKey="time" fill="#7F77DD" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Recent runs table ── */}
      <SectionTitle>Recent runs</SectionTitle>
      <Card>
        <CardTitle sub={`${source} · last ${runs.length}`}>Build history</CardTitle>
        {loading ? <EmptyState message="Loading…" /> :
         runs.length === 0 ? <EmptyState message="No runs yet — start your first run from your test project." /> : (
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] text-gray-400 border-b border-gray-100">
                <th className="text-left pb-2">Run</th>
                <th className="text-left pb-2">Env</th>
                <th className="text-left pb-2">Browser</th>
                <th className="text-left pb-2">Pass</th>
                <th className="text-left pb-2">Fail</th>
                <th className="text-left pb-2">Duration</th>
                <th className="text-right pb-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r, i) => {
                const total = (r.passed||0)+(r.failed||0)+(r.skipped||0)
                const rate  = total > 0 ? ((r.passed/total)*100).toFixed(1) : '0'
                return (
                  <tr key={r.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50">
                    <td className="py-2 font-medium">#{runs.length - i}</td>
                    <td className="py-2 text-gray-500">{r.environment}</td>
                    <td className="py-2 text-gray-500">{r.browser || '—'}</td>
                    <td className="py-2 text-green-700">{r.passed||0}</td>
                    <td className="py-2 text-red-600">{r.failed||0}</td>
                    <td className="py-2 text-gray-500">{r.duration_ms ? `${(r.duration_ms/60000).toFixed(1)}m` : '—'}</td>
                    <td className="py-2 text-right">
                      <Pill status={parseFloat(rate)>=85?'passed':'failed'} label={`${rate}%`} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
