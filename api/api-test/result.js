const supabase        = require('../../lib/supabase')
const { authenticate } = require('../../lib/auth')

module.exports = async (req, res) => {
  const project = await authenticate(req, res)
  if (!project) return

  if (req.method !== 'POST') return res.status(405).end()

  const {
    runId, testName, endpoint, method, statusCode,
    durationMs, passed, assertion,
    requestBody, responseBody, errorMessage, source
  } = req.body

  const { data, error } = await supabase
    .from('api_test_results')
    .insert({
      run_id:        runId,
      project_id:    project.id,
      test_name:     testName,
      endpoint,
      method:        method?.toUpperCase(),
      status_code:   statusCode,
      duration_ms:   durationMs,
      passed,
      assertion,
      request_body:  typeof requestBody  === 'object' ? JSON.stringify(requestBody)  : requestBody,
      response_body: typeof responseBody === 'object' ? JSON.stringify(responseBody) : responseBody,
      error_message: errorMessage,
      source
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true, id: data.id })
}
