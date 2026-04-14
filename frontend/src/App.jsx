import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { createContext, useContext, useState, useEffect } from 'react'
import { projectAPI } from './api'
import Sidebar from './components/Sidebar'
import Overview from './pages/Overview'
import Builds from './pages/Builds'
import TestCases from './pages/TestCases'
import Failures from './pages/Failures'
import DevIssues from './pages/DevIssues'
import ApiTesting from './pages/ApiTesting'
import SeverityPriority from './pages/SeverityPriority'
import TimeTracker from './pages/TimeTracker'
import CallSetup from './pages/CallSetup'
import IntegrationSetup from './pages/IntegrationSetup'

const ProjectCtx = createContext(null)
export const useProject = () => useContext(ProjectCtx)

const PROJECTS = [
  { name: 'ecommerce-project', label: 'E-Commerce Platform' },
  { name: 'mobile-project',    label: 'Mobile App' }
]

export default function App() {
  const [projectName, setProjectName] = useState(PROJECTS[0].name)
  const [projectId,   setProjectId]   = useState(null)
  const [source,      setSource]      = useState('local')
  const [apiError,    setApiError]    = useState(null)

  useEffect(() => {
    setProjectId(null) // reset while loading
    projectAPI.summary()
      .then(data => {
        if (data?.project?.id) {
          setProjectId(data.project.id)
          setApiError(null)
        }
      })
      .catch(err => {
        // Don't blank the screen — show helpful error in sidebar
        console.warn('[ATI] Could not resolve project ID:', err.message)
        setApiError(err.message)
        // App still renders — pages show "Loading..." or empty states
      })
  }, [projectName])

  return (
    <ProjectCtx.Provider value={{
      projectName, setProjectName,
      projectId,   // null until resolved — hooks guard against this
      source,      setSource,
      apiError,
      PROJECTS
    }}>
      <BrowserRouter>
        <div className="flex h-screen overflow-hidden bg-gray-50">
          <Sidebar />
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <Routes>
              <Route path="/"                  element={<Overview />} />
              <Route path="/builds"            element={<Builds />} />
              <Route path="/tests"             element={<TestCases />} />
              <Route path="/failures"          element={<Failures />} />
              <Route path="/dev-issues"        element={<DevIssues />} />
              <Route path="/api-testing"       element={<ApiTesting />} />
              <Route path="/severity-priority" element={<SeverityPriority />} />
              <Route path="/time-tracker"      element={<TimeTracker />} />
              <Route path="/call-setup"        element={<CallSetup />} />
              <Route path="/integration"       element={<IntegrationSetup />} />
              <Route path="*"                  element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ProjectCtx.Provider>
  )
}
