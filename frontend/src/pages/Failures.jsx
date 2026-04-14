// Failures.jsx
import { useEffect, useState } from 'react'
import { useProject } from '../App'
import { testAPI, runAPI } from '../api'
import { Card, CardTitle, PageHeader, Badge, Pill, SectionTitle, EmptyState } from '../components/UI'

export default function Failures() {
  const { projectName, source } = useProject()
  const [failures, setFailures] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    runAPI.list(source, 5).then(async runs => {
      if (!runs?.length) return
      const all = await Promise.all(
        runs.slice(0, 3).map(r => testAPI.results({ runId: r.id, limit: 50 }))
      )
      const flat = all.flat().filter(t => t.status === 'failed')
      setFailures(flat)
    })
  }, [projectName, source])

  const byCat = failures.reduce((acc, t) => {
    const c = t.failure_category || 'other'
    acc[c] = (acc[c] || 0) + 1
    return acc
  }, {})

  return (
    <div className="p-4">
      <PageHeader title="Failure intelligence" sub="Grouped failures with root cause hints">
        <Badge color="red">{failures.length} failures</Badge>
      </PageHeader>
      <div className="grid grid-cols-5 gap-2 mb-4">
        {Object.entries(byCat).map(([cat, count]) => (
          <div key={cat} className="bg-red-50 rounded-lg p-2.5">
            <div className="text-[10px] text-red-600 capitalize mb-1">{cat.replace('_',' ')}</div>
            <div className="text-xl font-medium text-red-700">{count}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardTitle>Failing tests</CardTitle>
          {failures.length === 0 ? <EmptyState message="No failures in last 3 runs" /> :
            failures.map(t => (
              <div key={t.id} onClick={() => setSelected(t)}
                className={`flex items-center gap-2 py-2 border-b border-gray-50 last:border-none cursor-pointer hover:bg-gray-50 -mx-1 px-1 rounded ${selected?.id === t.id ? 'bg-red-50' : ''}`}>
                <Pill status="failed" label="Fail" />
                <span className="flex-1 text-[11px] font-medium truncate">{t.test_name}</span>
                <span className="text-[10px] text-gray-400">{t.failure_category || 'other'}</span>
              </div>
            ))
          }
        </Card>
        <Card>
          <CardTitle>Failure detail</CardTitle>
          {!selected ? <EmptyState message="Select a failure to see details" /> : (
            <div>
              <div className="text-xs font-medium text-gray-900 mb-2">{selected.test_name}</div>
              <div className="flex gap-2 mb-3 flex-wrap">
                <Badge color="gray">{selected.module || 'General'}</Badge>
                {selected.failure_category && <Badge color="red">{selected.failure_category}</Badge>}
                <span className="text-[10px] text-gray-400">{selected.duration_ms}ms · {selected.retry_count} retries</span>
              </div>
              {selected.error_message && (
                <div className="mb-3">
                  <div className="text-[10px] text-gray-400 mb-1">Error message</div>
                  <div className="text-[11px] bg-red-50 text-red-800 rounded-lg p-2.5 font-mono">
                    {selected.error_message}
                  </div>
                </div>
              )}
              {selected.stack_trace && (
                <div>
                  <div className="text-[10px] text-gray-400 mb-1">Stack trace</div>
                  <pre className="text-[9px] font-mono bg-gray-50 rounded-lg p-2.5 overflow-auto max-h-40 text-gray-600 whitespace-pre-wrap">
                    {selected.stack_trace}
                  </pre>
                </div>
              )}
              {selected.screenshot_url && (
                <div className="mt-3">
                  <div className="text-[10px] text-gray-400 mb-1">Screenshot</div>
                  <img src={selected.screenshot_url} alt="failure" className="w-full rounded-lg border border-gray-200" />
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
