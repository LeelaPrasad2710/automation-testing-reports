const supabase        = require('../lib/supabase')
const { authenticate } = require('../lib/auth')

// GET   /api/calls
// POST  /api/calls
// PATCH /api/calls?id=xxx
module.exports = async (req, res) => {
  const project = await authenticate(req, res)
  if (!project) return

  const { id } = req.query

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('calls').select('*')
      .eq('project_id', project.id)
      .order('scheduled_at', { ascending: false }).limit(20)
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data || [])
  }

  if (req.method === 'POST') {
    const { title, callType, platform, participants, notes, scheduledAt } = req.body
    const { data, error } = await supabase.from('calls')
      .insert({
        project_id: project.id, title,
        call_type: callType, platform, participants, notes,
        scheduled_at: scheduledAt || null
      }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  if (req.method === 'PATCH' && id) {
    const { status } = req.body
    const updates = { status }
    if (status === 'live')      updates.started_at = new Date().toISOString()
    if (status === 'completed') updates.ended_at   = new Date().toISOString()
    const { data, error } = await supabase.from('calls')
      .update(updates).eq('id', id).eq('project_id', project.id)
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  res.status(405).json({ error: 'Method not allowed' })
}
