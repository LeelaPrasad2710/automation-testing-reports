// api/dev-issue/update.js  — PATCH /api/dev-issue/update?id=xxx
const supabase        = require('../../lib/supabase')
const { authenticate } = require('../../lib/auth')

module.exports = async (req, res) => {
  const project = await authenticate(req, res)
  if (!project) return
  if (req.method !== 'PATCH') return res.status(405).end()
  const { id } = req.query
  const { status, note, reason, assignee } = req.body
  const { data, error } = await supabase
    .from('dev_issues')
    .update({ status, note, reason, assignee, updated_at: new Date() })
    .eq('id', id).eq('project_id', project.id)
    .select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}
