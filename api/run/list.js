const supabase        = require('../../lib/supabase')
const { authenticate } = require('../../lib/auth')

module.exports = async (req, res) => {
  const project = await authenticate(req, res)
  if (!project) return

  if (req.method !== 'GET') return res.status(405).end()

  const { source, limit = '10' } = req.query

  let q = supabase
    .from('runs')
    .select('*')
    .eq('project_id', project.id)
    .order('started_at', { ascending: false })
    .limit(parseInt(limit))

  if (source) q = q.eq('source', source)

  const { data, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
}
