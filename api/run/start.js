const supabase        = require('../../lib/supabase')
const { authenticate } = require('../../lib/auth')

module.exports = async (req, res) => {
  const project = await authenticate(req, res)
  if (!project) return

  if (req.method !== 'POST') return res.status(405).end()

  const {
    source = 'local', environment = 'QA',
    browser, os, branch, triggeredBy, totalTests
  } = req.body

  const { data: run, error } = await supabase
    .from('runs')
    .insert({
      project_id:   project.id,
      source,
      environment,
      browser,
      os,
      branch,
      triggered_by: triggeredBy,
      total_tests:  totalTests || 0,
      status:       'running'
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Supabase Realtime picks this up automatically —
  // the frontend subscribes to the 'runs' table and gets notified instantly.
  res.json({ success: true, runId: run.id })
}
