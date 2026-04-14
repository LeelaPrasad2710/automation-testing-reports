import { useState, useCallback } from 'react'
import { useRealtime } from './useRealtime'

/**
 * useLiveRun(projectId, source)
 *
 * Tracks live run state via Supabase Realtime.
 * Updates in real-time as each test result is inserted into the DB.
 */
export function useLiveRun(projectId, source) {
  const [liveRun,      setLiveRun]      = useState(null)
  const [liveTests,    setLiveTests]    = useState([])
  const [liveApiTests, setLiveApiTests] = useState([])

  useRealtime(projectId, source, {
    onRunChange: (run, eventType) => {
      if (run.status === 'running') {
        // New run started
        setLiveRun({
          ...run,
          passed: 0, failed: 0, skipped: 0, total: 0
        })
        setLiveTests([])
        setLiveApiTests([])
      } else if (run.status === 'completed') {
        // Run finished — update with final stats from DB
        setLiveRun(prev => prev ? { ...prev, ...run } : null)
      }
    },

    onTestResult: (result) => {
      // Add to live test list (keep last 200)
      setLiveTests(prev => [result, ...prev].slice(0, 200))

      // Update running counters
      setLiveRun(prev => {
        if (!prev || prev.id !== result.run_id) return prev
        return {
          ...prev,
          passed:  prev.passed  + (result.status === 'passed'  ? 1 : 0),
          failed:  prev.failed  + (result.status === 'failed'  ? 1 : 0),
          skipped: prev.skipped + (result.status === 'skipped' ? 1 : 0),
          total:   (prev.total  || 0) + 1
        }
      })
    },

    onApiTestResult: (result) => {
      setLiveApiTests(prev => [result, ...prev].slice(0, 100))
    }
  })

  const clearLive = useCallback(() => {
    setLiveRun(null)
    setLiveTests([])
    setLiveApiTests([])
  }, [])

  const passRate = liveRun && liveRun.total > 0
    ? ((liveRun.passed / liveRun.total) * 100).toFixed(1)
    : null

  return { liveRun, liveTests, liveApiTests, passRate, clearLive }
}
