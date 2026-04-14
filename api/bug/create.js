// api/bug/create.js
const supabase = require('../../lib/supabase')
const { authenticate } = require('../../lib/auth')
module.exports = async (req, res) => {
  const project = await authenticate(req, res); if (!project) return
  if (req.method !== 'POST') return res.status(405).end()
  const { runId, testId, title, description, severity, priority, jiraId, assignedTo } = req.body
  const { data, error } = await supabase.from('bugs').insert({
    project_id: project.id, run_id: runId, test_id: testId,
    title, description, severity, priority, jira_id: jiraId, assigned_to: assignedTo
  }).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}
