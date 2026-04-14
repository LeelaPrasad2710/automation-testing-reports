import { useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

// Supabase client for frontend — uses ANON key (safe to expose)
let _supabase = null
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
  }
  return _supabase
}

/**
 * useRealtime(projectId, source, handlers)
 *
 * Subscribes to Supabase Realtime for live dashboard updates.
 * Replaces Socket.io — no separate server needed, free on Supabase.
 *
 * handlers = {
 *   onRunChange:     (run)        => {},  // run started or completed
 *   onTestResult:    (testResult) => {},  // new test result inserted
 *   onApiTestResult: (apiResult)  => {},  // new API test result
 *   onDevIssue:      (issue)      => {},  // dev issue created/updated
 *   onBugChange:     (bug)        => {},  // bug created/updated
 *   onCallChange:    (call)       => {},  // call status changed
 * }
 */
export function useRealtime(projectId, source, handlers = {}) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!projectId) return
    const sb = getSupabase()

    // Subscribe to runs table — filtered by project + source
    const runsSub = sb
      .channel(`runs:${projectId}:${source}`)
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'runs',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        const run = payload.new
        // Only fire for matching source
        if (run.source !== source) return
        handlersRef.current.onRunChange?.(run, payload.eventType)
      })
      .subscribe()

    // Subscribe to test_results — fires after every single test
    const testsSub = sb
      .channel(`test_results:${projectId}:${source}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'test_results',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        const result = payload.new
        if (result.source !== source) return
        handlersRef.current.onTestResult?.(result)
      })
      .subscribe()

    // Subscribe to api_test_results
    const apiTestsSub = sb
      .channel(`api_tests:${projectId}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'api_test_results',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        handlersRef.current.onApiTestResult?.(payload.new)
      })
      .subscribe()

    // Subscribe to dev_issues (kanban board)
    const devIssuesSub = sb
      .channel(`dev_issues:${projectId}`)
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'dev_issues',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        handlersRef.current.onDevIssue?.(payload.new, payload.eventType)
      })
      .subscribe()

    // Subscribe to bugs
    const bugsSub = sb
      .channel(`bugs:${projectId}`)
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'bugs',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        handlersRef.current.onBugChange?.(payload.new, payload.eventType)
      })
      .subscribe()

    // Subscribe to calls
    const callsSub = sb
      .channel(`calls:${projectId}`)
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'calls',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        handlersRef.current.onCallChange?.(payload.new, payload.eventType)
      })
      .subscribe()

    // Cleanup all subscriptions on unmount
    return () => {
      sb.removeChannel(runsSub)
      sb.removeChannel(testsSub)
      sb.removeChannel(apiTestsSub)
      sb.removeChannel(devIssuesSub)
      sb.removeChannel(bugsSub)
      sb.removeChannel(callsSub)
    }
  }, [projectId, source])
}

// Export supabase client for direct use in components
export { getSupabase }
