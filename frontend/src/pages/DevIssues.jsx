import { useEffect, useState } from 'react'
import { useProject } from '../App'
import { useRealtime } from '../hooks/useRealtime'
import { devIssueAPI } from '../api'
import { Card, PageHeader, Badge, Pill, Avatar, SectionTitle, EmptyState } from '../components/UI'

const COLUMNS = [
  { key: 'new_failure',    label: 'New failure',       color: 'border-t-red-400',    badge: 'bg-red-50 text-red-700' },
  { key: 'investigation',  label: 'Investigation',      color: 'border-t-amber-400',  badge: 'bg-amber-50 text-amber-700' },
  { key: 'rerun_required', label: 'Re-run required',    color: 'border-t-blue-400',   badge: 'bg-blue-50 text-blue-700' },
  { key: 'not_a_bug',      label: 'Not a bug',          color: 'border-t-gray-400',   badge: 'bg-gray-100 text-gray-600' },
  { key: 'resolved',       label: 'Resolved',           color: 'border-t-green-400',  badge: 'bg-green-50 text-green-700' }
]

const NEXT_STATUS = {
  new_failure:    ['investigation', 'not_a_bug'],
  investigation:  ['rerun_required', 'not_a_bug', 'resolved'],
  rerun_required: ['new_failure', 'resolved'],
  not_a_bug:      ['resolved'],
  resolved:       []
}

export default function DevIssues() {
  const { projectName, projectId } = useProject()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    devIssueAPI.list().then(d => { setIssues(d || []); setLoading(false) })
  }, [projectName])

  useRealtime(projectId, source, {
    onDevIssue: (d, eventType) => {
      if (eventType === 'INSERT') setIssues(prev => [d, ...prev])
      else setIssues(prev => prev.map(i => i.id === d.id ? d : i))
    }
  })

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.key] = issues.filter(i => i.status === col.key)
    return acc
  }, {})

  async function moveTo(issue, newStatus) {
    const updated = await devIssueAPI.update(issue.id, {
      status: newStatus,
      note: note || issue.note
    })
    if (updated) {
      setIssues(prev => prev.map(i => i.id === updated.id ? updated : i))
      setSelected(null)
      setNote('')
    }
  }

  return (
    <div className="p-4">
      <PageHeader title="Developer issue board" sub="Live kanban — auto-updated from test runs">
        <Badge color="red">
          {issues.filter(i => i.status === 'new_failure').length} new failures
        </Badge>
        <Badge color="amber">
          {issues.filter(i => i.status === 'investigation').length} investigating
        </Badge>
      </PageHeader>

      {/* Detail panel */}
      {selected && (
        <div className="mb-4 bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-xs font-medium text-gray-900 mb-1">{selected.test_name}</div>
              <div className="flex gap-2">
                <Pill status={selected.priority?.toLowerCase() || 'P3'} label={selected.priority || 'P3'} />
                <Badge color="gray">{selected.module || 'General'}</Badge>
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >×</button>
          </div>
          {selected.note && (
            <div className="text-[11px] text-gray-600 bg-gray-50 rounded-lg p-2.5 mb-3">
              {selected.note}
            </div>
          )}
          <div className="mb-3">
            <label className="text-[10px] text-gray-500 mb-1 block">Add note / reason</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Confirmed env issue — not a product bug"
              className="w-full text-[11px] bg-gray-50 border border-gray-200 rounded-lg p-2 resize-none h-16"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(NEXT_STATUS[selected.status] || []).map(s => {
              const col = COLUMNS.find(c => c.key === s)
              return (
                <button
                  key={s}
                  onClick={() => moveTo(selected, s)}
                  className="text-[11px] px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 font-medium text-gray-700"
                >
                  Move → {col?.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Kanban board */}
      <div className="grid grid-cols-5 gap-2">
        {COLUMNS.map(col => (
          <div
            key={col.key}
            className={`bg-gray-50 rounded-xl border-t-2 ${col.color} p-2`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium text-gray-600">{col.label}</span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${col.badge}`}>
                {grouped[col.key]?.length || 0}
              </span>
            </div>
            <div className="space-y-2">
              {loading ? (
                <div className="text-[10px] text-gray-400 py-3 text-center">Loading…</div>
              ) : grouped[col.key]?.length === 0 ? (
                <div className="text-[10px] text-gray-300 py-3 text-center">Empty</div>
              ) : (
                grouped[col.key].map(issue => (
                  <div
                    key={issue.id}
                    onClick={() => { setSelected(issue); setNote(issue.note || '') }}
                    className="bg-white border border-gray-100 rounded-lg p-2 cursor-pointer hover:border-gray-300 transition-colors"
                  >
                    <div className="text-[10px] font-medium text-gray-900 mb-1.5 leading-tight">
                      {issue.test_name}
                    </div>
                    <div className="flex gap-1 flex-wrap mb-1.5">
                      {issue.priority && (
                        <Pill status={issue.priority} label={issue.priority} />
                      )}
                      {issue.module && (
                        <span className="text-[9px] text-gray-400">{issue.module}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-gray-400">
                        {issue.assignee || 'Unassigned'}
                      </span>
                      <span className="text-[9px] text-gray-300">
                        {new Date(issue.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {issue.note && (
                      <div className="mt-1.5 text-[9px] text-gray-500 bg-gray-50 rounded p-1 line-clamp-2">
                        {issue.note}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
