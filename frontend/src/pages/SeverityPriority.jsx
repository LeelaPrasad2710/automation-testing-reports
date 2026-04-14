// SeverityPriority.jsx
import { useEffect, useState } from 'react'
import { useProject } from '../App'
import { bugAPI, devIssueAPI } from '../api'
import { Card, CardTitle, PageHeader, Badge, Pill, SectionTitle, EmptyState } from '../components/UI'

export default function SeverityPriority() {
  const { projectName } = useProject()
  const [bugs, setBugs] = useState([])

  useEffect(() => { bugAPI.list().then(d => setBugs(d || [])) }, [projectName])

  const bySev = { P1: [], P2: [], P3: [], P4: [] }
  bugs.forEach(b => { if (bySev[b.severity]) bySev[b.severity].push(b) })

  const SEV_STYLE = {
    P1: { card: 'bg-red-50   border-red-200',   num: 'text-red-700',   lbl: 'P1 · Critical',  sub: 'Fix now' },
    P2: { card: 'bg-amber-50 border-amber-200', num: 'text-amber-700', lbl: 'P2 · High',       sub: 'This sprint' },
    P3: { card: 'bg-blue-50  border-blue-200',  num: 'text-blue-700',  lbl: 'P3 · Medium',     sub: 'Next sprint' },
    P4: { card: 'bg-gray-50  border-gray-200',  num: 'text-gray-600',  lbl: 'P4 · Low',        sub: 'Nice to fix' },
  }

  return (
    <div className="p-4">
      <PageHeader title="Severity & priority" sub="Bug classification and effort vs impact matrix">
        <Badge color="red">{bugs.filter(b => b.status === 'open').length} open</Badge>
      </PageHeader>

      <SectionTitle>Severity breakdown</SectionTitle>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {Object.entries(SEV_STYLE).map(([sev, st]) => (
          <div key={sev} className={`rounded-xl border p-3.5 ${st.card}`}>
            <div className={`text-[10px] font-medium mb-2 ${st.num}`}>{st.lbl}</div>
            <div className={`text-3xl font-medium leading-none mb-1 ${st.num}`}>{bySev[sev].length}</div>
            <div className={`text-[10px] ${st.num} opacity-70`}>{st.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card>
          <CardTitle>Effort vs impact matrix</CardTitle>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {[
              { label: 'Do first',        sub: 'Low effort · High impact', color: 'bg-green-50 border-green-200',  text: 'text-green-700',  count: bugs.filter(b => b.priority === 'high').length },
              { label: 'Plan carefully',  sub: 'High effort · High impact', color: 'bg-amber-50 border-amber-200', text: 'text-amber-700',  count: Math.ceil(bugs.length * 0.15) },
              { label: 'Fill in gaps',    sub: 'Low effort · Low impact',   color: 'bg-blue-50  border-blue-200',  text: 'text-blue-700',   count: bugs.filter(b => b.priority === 'medium').length },
              { label: 'Deprioritise',    sub: 'High effort · Low impact',  color: 'bg-gray-50  border-gray-200',  text: 'text-gray-600',   count: bugs.filter(b => b.priority === 'low').length },
            ].map(q => (
              <div key={q.label} className={`rounded-xl border p-3 ${q.color}`}>
                <div className={`text-[10px] font-medium ${q.text}`}>{q.label}</div>
                <div className={`text-[9px] ${q.text} opacity-70 mb-2`}>{q.sub}</div>
                <div className={`text-2xl font-medium ${q.text}`}>{q.count}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle sub="Open bugs">Bug list</CardTitle>
          {bugs.length === 0 ? <EmptyState message="No bugs yet" /> :
            bugs.slice(0, 8).map(b => (
              <div key={b.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-none">
                <Pill status={b.severity?.toLowerCase() || 'P3'} label={b.severity} />
                <span className="flex-1 text-[11px] truncate">{b.title}</span>
                <Pill status={b.status} label={b.status} />
              </div>
            ))
          }
        </Card>
      </div>
    </div>
  )
}
