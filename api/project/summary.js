// api/project/summary.js
const supabase = require('../../lib/supabase')
const { authenticate } = require('../../lib/auth')
module.exports = async (req, res) => {
  const project = await authenticate(req, res); if (!project) return
  if (req.method !== 'GET') return res.status(405).end()
  const pid = project.id
  const [runs, bugs, issues] = await Promise.all([
    supabase.from('runs').select('*').eq('project_id', pid).order('started_at', { ascending: false }).limit(10),
    supabase.from('bugs').select('id,status,severity').eq('project_id', pid),
    supabase.from('dev_issues').select('id,status').eq('project_id', pid)
  ])
  res.json({
    project,
    recentRuns: runs.data || [],
    bugs:       bugs.data || [],
    devIssues:  issues.data || []
  })
}
