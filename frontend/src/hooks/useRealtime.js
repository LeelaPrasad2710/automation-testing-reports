import { useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

let _supabase = null
export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
  }
  return _supabase
}

/**
 * Fixed version — 3 issues resolved:
 * 1. Guard against null projectId (causes blank screen crash)
 * 2. Proper channel cleanup before re-subscribing
 * 3. Single channel with all subscriptions (avoids the "cannot add callbacks after subscribe" error)
 */
export function useRealtime(projectId, source, handlers = {}) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    // CRITICAL: do nothing until projectId is resolved from Supabase
    if (!projectId || !source) return

    const sb = getSupabase()

    // Use ONE channel with multiple postgres_changes listeners.
    // The old code used 6 separate channels — Supabase free tier limits
    // concurrent connections and "cannot add callbacks after subscribe()"
    // happens when a channel is reused. One channel = no conflict.
    const channelName = `ati:${projectId}:${source}:${Date.now()}`
    const channel = sb.channel(channelName)

    channel
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'runs',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        if (!payload.new) return
        if (payload.new.source !== source) return
        handlersRef.current.onRunChange?.(payload.new, payload.eventType)
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'test_results',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        if (!payload.new) return
        if (payload.new.source !== source) return
        handlersRef.current.onTestResult?.(payload.new)
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'api_test_results',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        if (!payload.new) return
        handlersRef.current.onApiTestResult?.(payload.new)
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'dev_issues',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        if (!payload.new) return
        handlersRef.current.onDevIssue?.(payload.new, payload.eventType)
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'bugs',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        if (!payload.new) return
        handlersRef.current.onBugChange?.(payload.new, payload.eventType)
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'calls',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        if (!payload.new) return
        handlersRef.current.onCallChange?.(payload.new, payload.eventType)
      })
      .subscribe((status, err) => {
        if (err) {
          // Don't crash — just log. Dashboard still works via polling.
          console.warn('[ATI Realtime] subscription status:', status, err?.message)
        }
      })

    return () => {
      sb.removeChannel(channel)
    }
  }, [projectId, source])
}
