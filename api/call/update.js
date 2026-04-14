const supabase = require('../../lib/supabase')
const { authenticate } = require('../../lib/auth')
module.exports = async (req, res) => {
  const project = await authenticate(req, res); if (!project) return
  if (req.method !== 'PATCH') return res.status(405).end()
  const { id } = req.query
  const { status } = req.body
  const updates = { status }
  if (status === 'live')      updates.started_at = new Date().toISOString()
  if (status === 'completed') updates.ended_at   = new Date().toISOString()
  const { data, error } = await supabase.from('calls')
    .update(updates).eq('id', id).eq('project_id', project.id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}
