const supabase        = require('../lib/supabase')
const { authenticate } = require('../lib/auth')

// GET  /api/members
// POST /api/members?action=timelog
module.exports = async (req, res) => {
  const project = await authenticate(req, res)
  if (!project) return

  const { action } = req.query

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('members')
      .select('*, time_logs(*)')
      .eq('project_id', project.id)
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data || [])
  }

  if (req.method === 'POST' && action === 'timelog') {
    const { memberId, sprint, activity, hours } = req.body
    const { data, error } = await supabase.from('time_logs')
      .insert({ member_id: memberId, project_id: project.id, sprint, activity, hours })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  res.status(405).json({ error: 'Method not allowed' })
}
