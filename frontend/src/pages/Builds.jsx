// ── Builds.jsx ───────────────────────────────────────────
import { useEffect, useState } from 'react'
import { useProject } from '../App'
import { runAPI, testAPI } from '../api'
import { Card, CardTitle, PageHeader, Badge, Pill, SectionTitle, ProgressBar, EmptyState } from '../components/UI'

export function Builds() {
  const { projectName, source } = useProject()
  const [runs, setRuns]       = useState([])
  const [selRun, setSelRun]   = useState(null)
  const [tests, setTests]     = useState([])

  useEffect(() => {
    runAPI.list(source, 20).then(r => {
      setRuns(r || [])
      if (r?.length) selectRun(r[0])
    })
  }, [projectName, source])

  function selectRun(run) {
    setSelRun(run)
    testAPI.results({ runId: run.id, limit: 100 }).then(d => setTests(d || []))
  }

  return (
    <div className="p-4">
      <PageHeader title="Builds" sub="All runs — click to drill down">
        <Badge color={source === 'local' ? 'teal' : 'blue'}>{source}</Badge>
      </PageHeader>
      <div className="grid grid-cols-3 gap-3">
        <Card className="col-span-1">
          <CardTitle>All runs</CardTitle>
          <div className="space-y-1.5">
            {runs.length === 0 && <EmptyState message="No runs yet" />}
            {runs.map((r, i) => {
              const total = (r.passed||0)+(r.failed||0)+(r.skipped||0)
              const rate  = total > 0 ? Math.round((r.passed/total)*100) : 0
              return (
                <div
                  key={r.id}
                  onClick={() => selectRun(r)}
                  className={`p-2.5 rounded-lg cursor-pointer border transition-colors ${
                    selRun?.id === r.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium">Run #{runs.length - i}</span>
                    <Pill status={rate >= 85 ? 'passed' : 'failed'} label={`${rate}%`} />
                  </div>
                  <ProgressBar pct={rate} color={rate >= 85 ? 'bg-green-500' : 'bg-red-400'} />
                  <div className="flex justify-between mt-1 text-[9px] text-gray-400">
                    <span>{r.environment} · {r.source}</span>
                    <span>{new Date(r.started_at).toLocaleDateString()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
        <Card className="col-span-2">
          <CardTitle sub={selRun ? `${selRun.environment} · ${selRun.browser || '—'}` : ''}>
            {selRun ? `Run details — ${tests.length} tests` : 'Select a run'}
          </CardTitle>
          {!selRun ? <EmptyState message="Select a run on the left" /> : (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[10px] text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2">Test</th>
                  <th className="text-left pb-2">Module</th>
                  <th className="text-left pb-2">Time</th>
                  <th className="text-left pb-2">Retries</th>
                  <th className="text-right pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {tests.map(t => (
                  <tr key={t.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50">
                    <td className="py-1.5 font-medium max-w-[180px] truncate">{t.test_name}</td>
                    <td className="py-1.5 text-gray-500">{t.module || '—'}</td>
                    <td className="py-1.5 text-gray-500">{t.duration_ms}ms</td>
                    <td className="py-1.5 text-gray-500">{t.retry_count}</td>
                    <td className="py-1.5 text-right"><Pill status={t.status} label={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  )
}
export default Builds
