const supabase        = require('../lib/supabase')
const { authenticate } = require('../lib/auth')

// POST /api/tests          — push one test result (called per test by SDK)
// GET  /api/tests?runId=&status=&module=&limit=
module.exports = async (req, res) => {
  const project = await authenticate(req, res)
  if (!project) return

  // ── GET — fetch results ──────────────────────────────
  if (req.method === 'GET') {
    const { runId, status, module: mod, limit = '100' } = req.query
    let q = supabase
      .from('test_results').select('*')
      .eq('project_id', project.id)
      .order('executed_at', { ascending: false })
      .limit(parseInt(limit))
    if (runId)  q = q.eq('run_id', runId)
    if (status) q = q.eq('status', status)
    if (mod)    q = q.eq('module', mod)
    const { data, error } = await q
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data || [])
  }

  // ── POST — record one test result ────────────────────
  if (req.method === 'POST') {
    const {
      runId, testName, module: mod, status,
      durationMs, retryCount = 0,
      errorMessage, stackTrace, screenshotBase64,
      failureCategory, source, browser, os
    } = req.body

    // Upload screenshot to Supabase Storage if provided
    let screenshotUrl = null
    if (screenshotBase64 && status === 'failed') {
      const buf  = Buffer.from(screenshotBase64, 'base64')
      const path = `${project.id}/${runId}/${Date.now()}.png`
      const { error: upErr } = await supabase.storage
        .from('screenshots')
        .upload(path, buf, { contentType: 'image/png', upsert: true })
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage
          .from('screenshots').getPublicUrl(path)
        screenshotUrl = publicUrl
      }
    }

    const { data, error } = await supabase
      .from('test_results')
      .insert({
        run_id: runId, project_id: project.id,
        test_name: testName, module: mod, status,
        duration_ms: durationMs, retry_count: retryCount,
        error_message: errorMessage, stack_trace: stackTrace,
        screenshot_url: screenshotUrl,
        failure_category: failureCategory,
        source, browser, os
      })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true, id: data.id })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
