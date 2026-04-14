// TimeTracker.jsx
import { useEffect, useState } from 'react'
import { useProject } from '../App'
import { memberAPI } from '../api'
import { Card, CardTitle, PageHeader, Badge, Avatar, SectionTitle, ProgressBar, EmptyState } from '../components/UI'

export default function TimeTracker() {
  const { projectName } = useProject()
  const [members, setMembers] = useState([])
  const [sprint,  setSprint]  = useState('Sprint 14')

  useEffect(() => { memberAPI.list().then(d => setMembers(d || [])) }, [projectName])

  const ACTIVITIES = [
    { key: 'writing_tests',          label: 'Writing tests',       color: 'bg-blue-500' },
    { key: 'investigating_failures', label: 'Investigating',        color: 'bg-red-500' },
    { key: 'fixing_flaky',           label: 'Fixing flaky',         color: 'bg-amber-500' },
    { key: 'framework_maintenance',  label: 'Framework maint.',     color: 'bg-violet-500' },
    { key: 'code_review',            label: 'Code review',          color: 'bg-teal-500' },
    { key: 'documentation',          label: 'Docs',                 color: 'bg-gray-400' },
  ]

  return (
    <div className="p-4">
      <PageHeader title="Time tracker" sub="Sprint-level time allocation per member and activity">
        <Badge color="blue">{sprint}</Badge>
      </PageHeader>

      {members.length === 0 ? (
        <EmptyState message="No members yet. Add members via the API or integration setup." />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardTitle sub="Hours this sprint">Per member</CardTitle>
            {members.map(m => {
              const logs  = m.time_logs || []
              const hours = logs.reduce((s, l) => s + (parseFloat(l.hours) || 0), 0)
              const max   = 40
              return (
                <div key={m.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-none">
                  <Avatar initials={m.initials} color={m.color || 'blue'} />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px] font-medium text-gray-900">{m.name}</span>
                      <span className="text-[10px] text-gray-500">{hours.toFixed(1)}h</span>
                    </div>
                    <ProgressBar pct={(hours / max) * 100} color="bg-blue-500" />
                    <div className="text-[9px] text-gray-400 mt-0.5">{m.modules?.join(', ')}</div>
                  </div>
                </div>
              )
            })}
          </Card>

          <Card>
            <CardTitle sub="Across all members">By activity</CardTitle>
            {ACTIVITIES.map(act => {
              const totalHrs = members.reduce((s, m) => {
                const logs = (m.time_logs || []).filter(l => l.activity === act.key)
                return s + logs.reduce((a, l) => a + (parseFloat(l.hours) || 0), 0)
              }, 0)
              const maxH = 50
              return (
                <div key={act.key} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-none">
                  <span className="text-[10px] text-gray-600 w-32">{act.label}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${act.color}`} style={{ width: `${(totalHrs/maxH)*100}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-500 w-10 text-right">{totalHrs.toFixed(1)}h</span>
                </div>
              )
            })}
          </Card>
        </div>
      )}
    </div>
  )
}
