import { NavLink } from 'react-router-dom'
import { useProject } from '../App'

const NAV = [
  { group: 'Core',
    items: [
      { to:'/',                label:'Overview',          dot:'bg-blue-500' },
      { to:'/builds',          label:'Builds',            dot:'bg-green-500' },
      { to:'/tests',           label:'Test cases',        dot:'bg-gray-400' },
      { to:'/failures',        label:'Failures',          dot:'bg-red-500' },
    ]
  },
  { group: 'Intelligence',
    items: [
      { to:'/dev-issues',      label:'Dev issues',        dot:'bg-red-400' },
      { to:'/severity-priority',label:'Severity / Priority',dot:'bg-amber-500'},
      { to:'/api-testing',     label:'API testing',       dot:'bg-violet-500'},
    ]
  },
  { group: 'Team',
    items: [
      { to:'/time-tracker',    label:'Time tracker',      dot:'bg-teal-500' },
      { to:'/call-setup',      label:'Call setup',        dot:'bg-blue-400' },
    ]
  },
  { group: 'Setup',
    items: [
      { to:'/integration',     label:'Integration setup', dot:'bg-gray-400' },
    ]
  }
]

export default function Sidebar() {
  const { projectName, setProjectName, source, setSource, PROJECTS } = useProject()

  return (
    <aside className="w-48 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-full">
      {/* Logo */}
      <div className="px-3 py-3 border-b border-gray-100">
        <div className="text-sm font-medium text-gray-900">ATI Dashboard</div>
        <div className="text-[10px] text-gray-400 mt-0.5">v4.0 · QA Intelligence</div>
      </div>

      {/* Project selector */}
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="text-[9px] font-medium text-gray-400 uppercase tracking-wider mb-1">Project</div>
        <select
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          className="w-full text-[11px] bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-700"
        >
          {PROJECTS.map(p => (
            <option key={p.name} value={p.name}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Source toggle — LOCAL vs CI/CD */}
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="text-[9px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Dashboard view</div>
        <div className="flex rounded overflow-hidden border border-gray-200 text-[10px]">
          <button
            onClick={() => setSource('local')}
            className={`flex-1 py-1 font-medium transition-colors ${
              source === 'local'
                ? 'bg-teal-50 text-teal-700'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            Local
          </button>
          <button
            onClick={() => setSource('cicd')}
            className={`flex-1 py-1 font-medium transition-colors border-l border-gray-200 ${
              source === 'cicd'
                ? 'bg-blue-50 text-blue-700'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            CI/CD
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-1 scrollbar-thin">
        {NAV.map(group => (
          <div key={group.group} className="mb-1">
            <div className="px-3 pt-2.5 pb-1 text-[9px] font-medium text-gray-400 uppercase tracking-wider">
              {group.group}
            </div>
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-[5px] text-[11px] border-l-2 transition-colors ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 text-gray-900 font-medium'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`
                }
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.dot}`} />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="px-3 py-2 text-[9px] text-gray-400 border-t border-gray-100">
        Last sync: just now
      </div>
    </aside>
  )
}
