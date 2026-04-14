const supabase = require('../../lib/supabase')
const { authenticate } = require('../../lib/auth')
module.exports = async (req, res) => {
  const project = await authenticate(req, res); if (!project) return
  if (req.method !== 'POST') return res.status(405).end()
  const { memberId, sprint, activity, hours } = req.body
  const { data, error } = await supabase.from('time_logs')
    .insert({ member_id: memberId, project_id: project.id, sprint, activity, hours })
    .select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}
