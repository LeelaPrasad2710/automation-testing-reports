const supabase        = require('../../lib/supabase')
const { authenticate } = require('../../lib/auth')

module.exports = async (req, res) => {
  const project = await authenticate(req, res)
  if (!project) return

  if (req.method !== 'POST') return res.status(405).end()

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
    const { error: uploadError } = await supabase.storage
      .from('screenshots')
      .upload(path, buf, { contentType: 'image/png', upsert: true })

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('screenshots').getPublicUrl(path)
      screenshotUrl = publicUrl
    }
  }

  const { data, error } = await supabase
    .from('test_results')
    .insert({
      run_id:           runId,
      project_id:       project.id,
      test_name:        testName,
      module:           mod,
      status,
      duration_ms:      durationMs,
      retry_count:      retryCount,
      error_message:    errorMessage,
      stack_trace:      stackTrace,
      screenshot_url:   screenshotUrl,
      failure_category: failureCategory,
      source,
      browser,
      os
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Supabase Realtime → dashboard updates instantly via subscription
  res.json({ success: true, id: data.id })
}
