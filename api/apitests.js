const supabase        = require('../lib/supabase')
const { authenticate } = require('../lib/auth')

// POST /api/apitests       — push API test result
// GET  /api/apitests?runId=&limit=
module.exports = async (req, res) => {
  const project = await authenticate(req, res)
  if (!project) return

  if (req.method === 'GET') {
    const { runId, limit = '100' } = req.query
    let q = supabase.from('api_test_results').select('*')
      .eq('project_id', project.id)
      .order('executed_at', { ascending: false })
      .limit(parseInt(limit))
    if (runId) q = q.eq('run_id', runId)
    const { data, error } = await q
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data || [])
  }

  if (req.method === 'POST') {
    const {
      runId, testName, endpoint, method, statusCode,
      durationMs, passed, assertion,
      requestBody, responseBody, errorMessage, source
    } = req.body
    const { data, error } = await supabase.from('api_test_results')
      .insert({
        run_id: runId, project_id: project.id,
        test_name: testName, endpoint,
        method: method?.toUpperCase(), status_code: statusCode,
        duration_ms: durationMs, passed, assertion,
        request_body:  typeof requestBody  === 'object' ? JSON.stringify(requestBody)  : requestBody,
        response_body: typeof responseBody === 'object' ? JSON.stringify(responseBody) : responseBody,
        error_message: errorMessage, source
      })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true, id: data.id })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
