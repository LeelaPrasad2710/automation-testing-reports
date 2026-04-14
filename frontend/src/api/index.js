import axios from 'axios'

// On Vercel: API functions live at /api/...  (same domain — no CORS!)
// Locally:   Vercel Dev serves them at http://localhost:3000/api/...
const api = axios.create({
  baseURL: '',   // same origin — Vercel routes /api/* automatically
  headers: {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_ATI_TOKEN || ''}`
  },
  timeout: 15000
})

api.interceptors.response.use(
  r  => r.data,
  err => {
    console.error('API error:', err.response?.data || err.message)
    return Promise.reject(err)
  }
)

export default api

// ── Typed API helpers ─────────────────────────────────────
export const projectAPI = {
  summary: () => api.get('/api/project/summary')
}

export const runAPI = {
  list: (source, limit = 10) =>
    api.get('/api/run/list', { params: { source, limit } }),
  get:  (id) => api.get(`/api/run/${id}`)
}

export const testAPI = {
  results: (params) => api.get('/api/test/results', { params }),
}

export const apiTestAPI = {
  results: (params) => api.get('/api/api-test/results', { params })
}

export const bugAPI = {
  list:   (status) => api.get('/api/bug/list', { params: { status } }),
  create: (data)   => api.post('/api/bug/create', data)
}

export const devIssueAPI = {
  list:   ()           => api.get('/api/dev-issue/list'),
  update: (id, data)   => api.patch(`/api/dev-issue/update?id=${id}`, data)
}

export const memberAPI = {
  list:    ()     => api.get('/api/member/list'),
  logTime: (data) => api.post('/api/member/timelog', data)
}

export const callAPI = {
  list:         ()           => api.get('/api/call/list'),
  create:       (data)       => api.post('/api/call/create', data),
  updateStatus: (id, status) => api.patch(`/api/call/update?id=${id}`, { status })
}
