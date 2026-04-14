const supabase        = require('../lib/supabase')
const { authenticate } = require('../lib/auth')

// GET  /api/project?resource=summary
// GET  /api/project?resource=bugs&status=open
// POST /api/project?resource=bugs
// GET  /api/project?resource=devissues
// PATCH /api/project?resource=devissues&id=xxx
module.exports = async (req, res) => {
  const project = await authenticate(req, res)
  if (!project) return

  const { resource, id, status } = req.query

  // ── Summary ──────────────────────────────────────────
  if (resource === 'summary' && req.method === 'GET') {
    const [runs, bugs, issues] = await Promise.all([
      supabase.from('runs').select('*')
        .eq('project_id', project.id)
        .order('started_at', { ascending: false }).limit(10),
      supabase.from('bugs').select('id,status,severity')
        .eq('project_id', project.id),
      supabase.from('dev_issues').select('id,status')
        .eq('project_id', project.id)
    ])
    return res.json({
      project,
      recentRuns: runs.data || [],
      bugs:       bugs.data || [],
      devIssues:  issues.data || []
    })
  }

  // ── Bugs GET ─────────────────────────────────────────
  if (resource === 'bugs' && req.method === 'GET') {
    let q = supabase.from('bugs').select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false })
    if (status) q = q.eq('status', status)
    const { data, error } = await q
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data || [])
  }

  // ── Bugs POST ────────────────────────────────────────
  if (resource === 'bugs' && req.method === 'POST') {
    const { runId, testId, title, description, severity, priority, jiraId, assignedTo } = req.body
    const { data, error } = await supabase.from('bugs')
      .insert({
        project_id: project.id, run_id: runId, test_id: testId,
        title, description, severity, priority,
        jira_id: jiraId, assigned_to: assignedTo
      }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  // ── Dev issues GET ───────────────────────────────────
  if (resource === 'devissues' && req.method === 'GET') {
    const { data, error } = await supabase.from('dev_issues').select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data || [])
  }

  // ── Dev issues PATCH ─────────────────────────────────
  if (resource === 'devissues' && req.method === 'PATCH') {
    const { status: newStatus, note, reason, assignee } = req.body
    const { data, error } = await supabase.from('dev_issues')
      .update({ status: newStatus, note, reason, assignee, updated_at: new Date() })
      .eq('id', id).eq('project_id', project.id)
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  res.status(404).json({ error: 'Unknown resource' })
}
