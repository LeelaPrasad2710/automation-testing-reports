const supabase = require('./supabase')

/**
 * Validates Bearer token from Authorization header.
 * Returns { project } on success or sends 401 and returns null.
 */
async function authenticate(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return null
  }

  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim()
  if (!token) {
    res.status(401).json({ error: 'Missing Authorization token' })
    return null
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select('id, name')
    .eq('token', token)
    .single()

  if (error || !project) {
    res.status(401).json({ error: 'Invalid token' })
    return null
  }

  return project
}

module.exports = { authenticate }
