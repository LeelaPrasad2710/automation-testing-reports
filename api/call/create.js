const supabase = require('../../lib/supabase')
const { authenticate } = require('../../lib/auth')
module.exports = async (req, res) => {
  const project = await authenticate(req, res); if (!project) return
  if (req.method !== 'POST') return res.status(405).end()
  const { title, callType, platform, participants, notes, scheduledAt } = req.body
  const { data, error } = await supabase.from('calls').insert({
    project_id: project.id, title,
    call_type: callType, platform, participants, notes,
    scheduled_at: scheduledAt || null
  }).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}
