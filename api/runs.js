const supabase        = require('../lib/supabase')
const { authenticate } = require('../lib/auth')

// POST /api/runs?action=start
// POST /api/runs?action=stop
// GET  /api/runs?source=local&limit=10
module.exports = async (req, res) => {
  const project = await authenticate(req, res)
  if (!project) return

  const { action, source, limit = '10' } = req.query

  // ── GET — list runs ──────────────────────────────────
  if (req.method === 'GET') {
    let q = supabase
      .from('runs').select('*')
      .eq('project_id', project.id)
      .order('started_at', { ascending: false })
      .limit(parseInt(limit))
    if (source) q = q.eq('source', source)
    const { data, error } = await q
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data || [])
  }

  // ── POST /api/runs?action=start ──────────────────────
  if (req.method === 'POST' && action === 'start') {
    const { source: src = 'local', environment = 'QA',
            browser, os, branch, triggeredBy, totalTests } = req.body
    const { data: run, error } = await supabase
      .from('runs')
      .insert({
        project_id:   project.id,
        source:       src,
        environment,  browser, os, branch,
        triggered_by: triggeredBy,
        total_tests:  totalTests || 0,
        status:       'running'
      })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true, runId: run.id })
  }

  // ── POST /api/runs?action=stop ───────────────────────
  if (req.method === 'POST' && action === 'stop') {
    const { runId, passed = 0, failed = 0, skipped = 0, durationMs } = req.body
    const { error } = await supabase
      .from('runs')
      .update({
        status:      'completed',
        passed, failed, skipped,
        total_tests: passed + failed + skipped,
        duration_ms: durationMs,
        ended_at:    new Date().toISOString()
      })
      .eq('id', runId).eq('project_id', project.id)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
