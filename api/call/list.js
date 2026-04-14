// api/call/list.js
const supabase = require('../../lib/supabase')
const { authenticate } = require('../../lib/auth')
module.exports = async (req, res) => {
  const project = await authenticate(req, res); if (!project) return
  if (req.method !== 'GET') return res.status(405).end()
  const { data, error } = await supabase.from('calls').select('*')
    .eq('project_id', project.id).order('scheduled_at', { ascending: false }).limit(20)
  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
}
