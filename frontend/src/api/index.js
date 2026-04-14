import axios from 'axios'

const api = axios.create({
  baseURL: '',
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

// ── Typed API helpers — all use new merged endpoints ─────
export const projectAPI = {
  summary: () => api.get('/api/project?resource=summary')
}

export const runAPI = {
  list:  (source, limit = 10) =>
    api.get('/api/runs', { params: { source, limit } }),
  start: (body) => api.post('/api/runs?action=start', body),
  stop:  (body) => api.post('/api/runs?action=stop',  body)
}

export const testAPI = {
  results: (params) => api.get('/api/tests',  { params }),
  submit:  (body)   => api.post('/api/tests', body)
}

export const apiTestAPI = {
  results: (params) => api.get('/api/apitests',  { params }),
  submit:  (body)   => api.post('/api/apitests', body)
}

export const bugAPI = {
  list:   (status) => api.get('/api/project?resource=bugs', { params: { status } }),
  create: (data)   => api.post('/api/project?resource=bugs', data)
}

export const devIssueAPI = {
  list:   ()           => api.get('/api/project?resource=devissues'),
  update: (id, data)   => api.patch(`/api/project?resource=devissues&id=${id}`, data)
}

export const memberAPI = {
  list:    ()     => api.get('/api/members'),
  logTime: (data) => api.post('/api/members?action=timelog', data)
}

export const callAPI = {
  list:         ()           => api.get('/api/calls'),
  create:       (data)       => api.post('/api/calls', data),
  updateStatus: (id, status) => api.patch(`/api/calls?id=${id}`, { status })
}
