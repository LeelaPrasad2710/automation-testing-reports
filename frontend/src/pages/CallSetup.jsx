// CallSetup.jsx
import { useEffect, useState } from 'react'
import { useProject } from '../App'
import { useRealtime } from '../hooks/useRealtime'
import { callAPI } from '../api'
import { Card, CardTitle, PageHeader, Badge, Avatar, SectionTitle, EmptyState, LiveDot } from '../components/UI'

const STATUS_STYLE = {
  live:      { dot: 'bg-red-500 live-pulse', label: 'Live now',        bar: 'border-t-red-400' },
  scheduled: { dot: 'bg-blue-500',           label: 'Scheduled',       bar: 'border-t-blue-400' },
  completed: { dot: 'bg-green-500',          label: 'Completed',       bar: 'border-t-green-400' },
}

const PLATFORM_COLOR = { Meet: 'blue', Teams: 'violet', Zoom: 'teal' }

export default function CallSetup() {
  const { projectName, projectId, source } = useProject()
  const [calls,     setCalls]     = useState([])
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState({
    title: '', callType: 'sync', platform: 'Meet',
    participants: '', scheduledAt: '', notes: ''
  })

  useEffect(() => {
    callAPI.list().then(d => setCalls(d || []))
  }, [projectName])

  useRealtime(projectId, source, {
    onCallChange: (d, eventType) => {
      if (eventType === 'INSERT') setCalls(prev => [d, ...prev])
      else setCalls(prev => prev.map(c => c.id === d.id ? d : c))
    }
  })

  async function createCall(e) {
    e.preventDefault()
    const parts = form.participants.split(',').map(s => s.trim()).filter(Boolean)
    const data  = await callAPI.create({
      title:        form.title,
      callType:     form.callType,
      platform:     form.platform,
      participants: parts,
      notes:        form.notes,
      scheduledAt:  form.scheduledAt || null
    })
    if (data) {
      setCalls(prev => [data, ...prev])
      setShowForm(false)
      setForm({ title:'', callType:'sync', platform:'Meet', participants:'', scheduledAt:'', notes:'' })
    }
  }

  async function setStatus(id, status) {
    const updated = await callAPI.updateStatus(id, status)
    if (updated) setCalls(prev => prev.map(c => c.id === id ? updated : c))
  }

  const live      = calls.filter(c => c.status === 'live')
  const scheduled = calls.filter(c => c.status === 'scheduled')
  const completed = calls.filter(c => c.status === 'completed').slice(0, 4)

  return (
    <div className="p-4">
      <PageHeader title="Call setup & sync board" sub="Incident calls, standups, review sessions">
        {live.length > 0 && <Badge color="red">● {live.length} live now</Badge>}
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-[11px] px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
        >
          + Schedule call
        </button>
      </PageHeader>

      {/* New call form */}
      {showForm && (
        <div className="mb-4 bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs font-medium text-gray-900 mb-3">Schedule a call</div>
          <form onSubmit={createCall} className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Title *</label>
              <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                placeholder="e.g. Sprint 14 QA sync"
                className="w-full text-[11px] bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Platform</label>
              <select value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}
                className="w-full text-[11px] bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
                {['Meet','Teams','Zoom'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Type</label>
              <select value={form.callType} onChange={e => setForm({...form, callType: e.target.value})}
                className="w-full text-[11px] bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
                {['incident','sync','review','planning','handoff'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Scheduled at</label>
              <input type="datetime-local" value={form.scheduledAt}
                onChange={e => setForm({...form, scheduledAt: e.target.value})}
                className="w-full text-[11px] bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5" />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-gray-500 mb-1 block">Participants (comma-separated initials)</label>
              <input value={form.participants} onChange={e => setForm({...form, participants: e.target.value})}
                placeholder="AB, PR, KR, SM"
                className="w-full text-[11px] bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5" />
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="text-[11px] px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit"
                className="text-[11px] px-4 py-1.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600">
                Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Live calls */}
      {live.length > 0 && (
        <>
          <SectionTitle live>Live now</SectionTitle>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {live.map(c => <CallCard key={c.id} call={c} onStatusChange={setStatus} />)}
          </div>
        </>
      )}

      {/* Scheduled */}
      <SectionTitle>Scheduled</SectionTitle>
      {scheduled.length === 0
        ? <p className="text-[11px] text-gray-400 mb-4">No upcoming calls scheduled.</p>
        : (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {scheduled.map(c => <CallCard key={c.id} call={c} onStatusChange={setStatus} />)}
          </div>
        )
      }

      {/* Completed */}
      <SectionTitle>Completed today</SectionTitle>
      {completed.length === 0
        ? <p className="text-[11px] text-gray-400">No completed calls yet.</p>
        : (
          <div className="grid grid-cols-3 gap-3">
            {completed.map(c => <CallCard key={c.id} call={c} onStatusChange={setStatus} />)}
          </div>
        )
      }
    </div>
  )
}

function CallCard({ call, onStatusChange }) {
  const st = STATUS_STYLE[call.status] || STATUS_STYLE.scheduled
  const parts = call.participants || []

  return (
    <div className={`bg-white border border-gray-100 rounded-xl p-3 border-t-2 ${st.bar}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`} />
        <span className="text-[10px] font-medium text-gray-500">{st.label}</span>
        {call.platform && (
          <span className="ml-auto text-[9px] text-gray-400">{call.platform}</span>
        )}
      </div>
      <div className="text-[11px] font-medium text-gray-900 mb-1 leading-snug">{call.title}</div>
      {call.scheduled_at && (
        <div className="text-[10px] text-gray-400 mb-2">
          {new Date(call.scheduled_at).toLocaleString([], {
            month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'
          })}
        </div>
      )}
      {parts.length > 0 && (
        <div className="flex gap-1 mb-2 flex-wrap">
          {parts.map((p, i) => (
            <div key={i} className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[8px] font-medium flex items-center justify-center">
              {p}
            </div>
          ))}
        </div>
      )}
      {call.notes && (
        <div className="text-[9px] text-gray-400 mb-2 line-clamp-1">{call.notes}</div>
      )}
      {/* Action buttons */}
      <div className="flex gap-1 mt-1">
        {call.status === 'scheduled' && (
          <button onClick={() => onStatusChange(call.id, 'live')}
            className="text-[9px] px-2 py-1 bg-red-50 text-red-700 rounded font-medium hover:bg-red-100">
            Start
          </button>
        )}
        {call.status === 'live' && (
          <button onClick={() => onStatusChange(call.id, 'completed')}
            className="text-[9px] px-2 py-1 bg-green-50 text-green-700 rounded font-medium hover:bg-green-100">
            End call
          </button>
        )}
      </div>
    </div>
  )
}
