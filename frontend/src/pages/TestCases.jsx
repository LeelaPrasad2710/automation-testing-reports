// TestCases.jsx
import { useEffect, useState } from 'react'
import { useProject } from '../App'
import { testAPI, runAPI } from '../api'
import { Card, PageHeader, Badge, Pill, SectionTitle, EmptyState } from '../components/UI'

export default function TestCases() {
  const { projectName, source } = useProject()
  const [tests,   setTests]   = useState([])
  const [filter,  setFilter]  = useState('all')
  const [search,  setSearch]  = useState('')
  const [runs,    setRuns]    = useState([])
  const [selRun,  setSelRun]  = useState('')

  useEffect(() => {
    runAPI.list(source, 10).then(r => {
      setRuns(r || [])
      if (r?.length) {
        setSelRun(r[0].id)
        testAPI.results({ runId: r[0].id, limit: 200 }).then(d => setTests(d || []))
      }
    })
  }, [projectName, source])

  const displayed = tests.filter(t => {
    const matchStatus = filter === 'all' || t.status === filter
    const matchSearch = !search || t.test_name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div className="p-4">
      <PageHeader title="Test cases" sub="All test results — filter and search">
        <Badge color={source === 'local' ? 'teal' : 'blue'}>{source}</Badge>
      </PageHeader>
      <div className="flex gap-2 mb-3 flex-wrap">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search test name..."
          className="text-[11px] bg-white border border-gray-200 rounded-lg px-3 py-1.5 w-52"
        />
        {['all','passed','failed','skipped','flaky'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-[10px] px-3 py-1.5 rounded-lg border capitalize transition-colors ${
              filter === s ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}>{s}</button>
        ))}
        <select value={selRun} onChange={e => {
          setSelRun(e.target.value)
          testAPI.results({ runId: e.target.value, limit: 200 }).then(d => setTests(d || []))
        }} className="text-[10px] bg-white border border-gray-200 rounded-lg px-2 py-1.5 ml-auto">
          {runs.map((r, i) => (
            <option key={r.id} value={r.id}>Run #{runs.length - i}</option>
          ))}
        </select>
      </div>
      <Card>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-[10px] text-gray-400 border-b border-gray-100">
              <th className="text-left pb-2">Test name</th>
              <th className="text-left pb-2">Module</th>
              <th className="text-left pb-2">Status</th>
              <th className="text-left pb-2">Duration</th>
              <th className="text-left pb-2">Retries</th>
              <th className="text-left pb-2">Category</th>
              <th className="text-left pb-2">Browser</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 && (
              <tr><td colSpan={7}><EmptyState message="No tests match" /></td></tr>
            )}
            {displayed.map(t => (
              <tr key={t.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50">
                <td className="py-2 font-medium max-w-[200px] truncate">{t.test_name}</td>
                <td className="py-2 text-gray-500">{t.module || '—'}</td>
                <td className="py-2"><Pill status={t.status} label={t.status} /></td>
                <td className="py-2 text-gray-500">{t.duration_ms}ms</td>
                <td className="py-2 text-gray-500">{t.retry_count}</td>
                <td className="py-2 text-gray-400 text-[10px]">{t.failure_category || '—'}</td>
                <td className="py-2 text-gray-400 text-[10px]">{t.browser || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
