// ── Shared UI primitives ─────────────────────────────────

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-gray-100 rounded-xl p-3.5 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, sub }) {
  return (
    <div className="flex justify-between items-center mb-2.5">
      <span className="text-xs font-medium text-gray-900">{children}</span>
      {sub && <span className="text-[10px] text-gray-400">{sub}</span>}
    </div>
  )
}

export function MetricCard({ label, value, sub, valueClass = '' }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2.5">
      <div className="text-[10px] text-gray-400 mb-1">{label}</div>
      <div className={`text-xl font-medium leading-none text-gray-900 ${valueClass}`}>{value}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}

export function PageHeader({ title, sub, children }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        {sub && <div className="text-[10px] text-gray-400 mb-0.5">{sub}</div>}
        <h1 className="text-base font-medium text-gray-900">{title}</h1>
      </div>
      {children && <div className="flex gap-2 flex-wrap">{children}</div>}
    </div>
  )
}

export function SectionTitle({ children, live = false }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-4 mb-2">
      {live && <LiveDot />}
      {children}
    </div>
  )
}

export function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" />
    </span>
  )
}

// status: pass | fail | skip | flaky | running
const PILL_STYLES = {
  passed:   'bg-green-50  text-green-800',
  failed:   'bg-red-50    text-red-800',
  skipped:  'bg-amber-50  text-amber-800',
  flaky:    'bg-blue-50   text-blue-800',
  running:  'bg-teal-50   text-teal-800',
  open:     'bg-red-50    text-red-800',
  resolved: 'bg-green-50  text-green-800',
  in_review:'bg-violet-50 text-violet-800',
  P1: 'bg-red-50    text-red-800',
  P2: 'bg-amber-50  text-amber-800',
  P3: 'bg-blue-50   text-blue-800',
  P4: 'bg-gray-100  text-gray-600',
}

export function Pill({ status, label, className = '' }) {
  const style = PILL_STYLES[status] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md ${style} ${className}`}>
      {label || status}
    </span>
  )
}

export function Badge({ children, color = 'gray' }) {
  const colors = {
    green:  'bg-green-50  text-green-800',
    red:    'bg-red-50    text-red-800',
    blue:   'bg-blue-50   text-blue-800',
    amber:  'bg-amber-50  text-amber-800',
    violet: 'bg-violet-50 text-violet-800',
    teal:   'bg-teal-50   text-teal-800',
    gray:   'bg-gray-100  text-gray-600',
  }
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${colors[color] || colors.gray}`}>
      {children}
    </span>
  )
}

export function MethodBadge({ method }) {
  const c = {
    GET:    'bg-green-50  text-green-800',
    POST:   'bg-blue-50   text-blue-800',
    PUT:    'bg-amber-50  text-amber-800',
    PATCH:  'bg-amber-50  text-amber-800',
    DELETE: 'bg-red-50    text-red-800',
  }
  return (
    <span className={`font-mono text-[9px] font-medium px-1.5 py-0.5 rounded ${c[method] || c.GET}`}>
      {method}
    </span>
  )
}

export function ProgressBar({ pct, color = 'bg-green-500', height = 'h-1.5' }) {
  return (
    <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${height}`}>
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, pct || 0))}%` }}
      />
    </div>
  )
}

export function Avatar({ initials, color = 'blue' }) {
  const c = {
    blue:   'bg-blue-100   text-blue-800',
    green:  'bg-green-100  text-green-800',
    violet: 'bg-violet-100 text-violet-800',
    amber:  'bg-amber-100  text-amber-800',
    teal:   'bg-teal-100   text-teal-800',
  }
  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-content-center text-[9px] font-medium flex-shrink-0 ${c[color] || c.blue} flex items-center justify-center`}>
      {initials}
    </div>
  )
}

export function EmptyState({ message = 'No data yet' }) {
  return (
    <div className="py-8 text-center text-[11px] text-gray-400">{message}</div>
  )
}
