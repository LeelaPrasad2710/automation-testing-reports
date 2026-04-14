// api/api-test/results.js
const supabase        = require('../../lib/supabase')
const { authenticate } = require('../../lib/auth')

module.exports = async (req, res) => {
  const project = await authenticate(req, res)
  if (!project) return
  if (req.method !== 'GET') return res.status(405).end()
  const { runId, limit = '100' } = req.query
  let q = supabase.from('api_test_results').select('*')
    .eq('project_id', project.id)
    .order('executed_at', { ascending: false })
    .limit(parseInt(limit))
  if (runId) q = q.eq('run_id', runId)
  const { data, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
}
