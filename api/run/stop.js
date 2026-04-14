const supabase        = require('../../lib/supabase')
const { authenticate } = require('../../lib/auth')

module.exports = async (req, res) => {
  const project = await authenticate(req, res)
  if (!project) return

  if (req.method !== 'POST') return res.status(405).end()

  const { runId, passed = 0, failed = 0, skipped = 0, durationMs } = req.body

  const { data: run, error } = await supabase
    .from('runs')
    .update({
      status:      'completed',
      passed,
      failed,
      skipped,
      total_tests: passed + failed + skipped,
      duration_ms: durationMs,
      ended_at:    new Date().toISOString()
    })
    .eq('id', runId)
    .eq('project_id', project.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Supabase Realtime broadcasts this update automatically
  res.json({ success: true })
}
