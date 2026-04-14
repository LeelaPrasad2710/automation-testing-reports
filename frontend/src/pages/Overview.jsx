import { useEffect, useState } from 'react'
import { useProject } from '../App'
import { useLiveRun } from '../hooks/useLiveRun'
import { useRealtime } from '../hooks/useRealtime'
import { runAPI, projectAPI } from '../api'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  Card, CardTitle, MetricCard, PageHeader, SectionTitle,
  Badge, Pill, ProgressBar, LiveDot, EmptyState
} from '../components/UI'

export default function Overview() {
  const { projectName, projectId, source } = useProject()
  const { liveRun, liveTests, passRate } = useLiveRun(projectId, source)
  const [runs, setRuns]       = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      runAPI.list(source, 10),
      projectAPI.summary()
    ]).then(([r, s]) => {
      setRuns(r || [])
      setSummary(s)
    }).finally(() => setLoading(false))
  }, [projectName, projectId, source])

  // Refresh runs list when a run completes
  useRealtime(projectId, source, {
    onRunChange: (run) => { if (run.status === 'completed') runAPI.list(source, 10).then(setRuns) }
  })

  const trendData = runs.slice().reverse().map((r, i) => ({
    name: `#${i + 1}`,
    pass: r.total_tests > 0 ? Math.round((r.passed / r.total_tests) * 100) : 0,
    fail: r.total_tests > 0 ? Math.round((r.failed / r.total_tests) * 100) : 0,
    time: r.duration_ms ? Math.round(r.duration_ms / 1000 / 60 * 10) / 10 : 0
  }))

  const latest      = runs[0]
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

  return (
    <div className="p-4">
      <PageHeader
        title="Automation Test Intelligence"
        sub={`${projectName} · ${source === 'local' ? 'Local runs' : 'CI/CD runs'}`}
      >
        <Badge color={source === 'local' ? 'teal' : 'blue'}>
          {source === 'local' ? 'Local' : 'CI/CD'}
        </Badge>
        {latest && <Badge color="green">Build #{runs.indexOf(latest) + 1}</Badge>}
        {liveRun && <Badge color="red">● Live</Badge>}
      </PageHeader>

      {/* Live run card */}
      {liveRun && (
        <div className="mb-4 bg-teal-50 border border-teal-200 rounded-xl p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <LiveDot />
            <span className="text-xs font-medium text-teal-800">
              Run in progress — {liveRun.environment} · {liveRun.browser}
            </span>
            <span className="ml-auto text-[10px] text-teal-600">{passRate}% pass rate</span>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-2.5">
            <div className="bg-white rounded-lg p-2 text-center">
              <div className="text-[10px] text-gray-400">Passed</div>
              <div className="text-lg font-medium text-green-700">{liveRun.passed}</div>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <div className="text-[10px] text-gray-400">Failed</div>
              <div className="text-lg font-medium text-red-700">{liveRun.failed}</div>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <div className="text-[10px] text-gray-400">Skipped</div>
              <div className="text-lg font-medium text-amber-700">{liveRun.skipped}</div>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <div className="text-[10px] text-gray-400">Total</div>
              <div className="text-lg font-medium text-gray-800">{liveRun.total}</div>
            </div>
          </div>
          <ProgressBar
            pct={liveRun.total > 0 ? (liveRun.passed / liveRun.total) * 100 : 0}
            color="bg-teal-500"
            height="h-2"
          />
          {/* Last 5 live test results */}
          {liveTests.length > 0 && (
            <div className="mt-2.5 space-y-1">
              {liveTests.slice(0, 5).map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px]">
                  <Pill status={t.status} label={t.status} />
                  <span className="flex-1 text-gray-700 truncate">{t.testName}</span>
                  <span className="text-gray-400">{t.durationMs}ms</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary metrics */}
      <SectionTitle>Latest build summary</SectionTitle>
      <div className="grid grid-cols-5 gap-2 mb-3">
        <MetricCard label="Pass rate"     value={`${latestRate}%`} valueClass="text-green-700" sub="Latest build" />
        <MetricCard label="Fail rate"     value={totalAll > 0 ? `${((totalFailed/totalAll)*100).toFixed(1)}%` : '—'} valueClass="text-red-600" />
        <MetricCard label="Total tests"   value={totalAll || '—'} sub={latest ? new Date(latest.started_at).toLocaleDateString() : ''} />
        <MetricCard label="Duration"      value={latest?.duration_ms ? `${(latest.duration_ms/60000).toFixed(1)}m` : '—'} />
        <MetricCard label="Total runs"    value={runs.length} sub={`${source} source`} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Card>
          <CardTitle sub="Last 10 builds">Pass / fail trend</CardTitle>
          <div className="flex gap-3 text-[10px] text-gray-500 mb-2">
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-green-500 inline-block" /> Pass %</span>
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-red-400 inline-block border-dashed" /> Fail %</span>
          </div>
          <ResponsiveContainer width="100%" height={110}>
            <LineChart data={trendData}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
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
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: d.color }} />
                {d.name} {d.value}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={110}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={28} outerRadius={48} dataKey="value">
                {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardTitle sub="Minutes">Exec time trend</CardTitle>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={trendData}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Bar dataKey="time" fill="#7F77DD" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent runs table */}
      <SectionTitle>Recent runs</SectionTitle>
      <Card>
        <CardTitle sub={`${source} · last ${runs.length}`}>Build history</CardTitle>
        {loading ? (
          <EmptyState message="Loading..." />
        ) : runs.length === 0 ? (
          <EmptyState message="No runs yet — start your first run from your test project." />
        ) : (
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] text-gray-400 border-b border-gray-100">
                <th className="text-left pb-2">Run</th>
                <th className="text-left pb-2">Env</th>
                <th className="text-left pb-2">Browser</th>
                <th className="text-left pb-2">Pass</th>
                <th className="text-left pb-2">Fail</th>
                <th className="text-left pb-2">Duration</th>
                <th className="text-right pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r, i) => {
                const total = (r.passed || 0) + (r.failed || 0) + (r.skipped || 0)
                const rate  = total > 0 ? ((r.passed / total) * 100).toFixed(1) : '0'
                return (
                  <tr key={r.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50">
                    <td className="py-2 font-medium">#{runs.length - i}</td>
                    <td className="py-2 text-gray-500">{r.environment}</td>
                    <td className="py-2 text-gray-500">{r.browser || '—'}</td>
                    <td className="py-2 text-green-700">{r.passed || 0}</td>
                    <td className="py-2 text-red-600">{r.failed || 0}</td>
                    <td className="py-2 text-gray-500">
                      {r.duration_ms ? `${(r.duration_ms / 60000).toFixed(1)}m` : '—'}
                    </td>
                    <td className="py-2 text-right">
                      <Pill
                        status={parseFloat(rate) >= 85 ? 'passed' : 'failed'}
                        label={`${rate}%`}
                      />
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
