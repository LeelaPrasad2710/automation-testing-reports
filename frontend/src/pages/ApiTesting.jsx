import { useEffect, useState, useRef } from 'react'
import { useProject } from '../App'
import { apiTestAPI, runAPI } from '../api'
import { Card, CardTitle, PageHeader, Badge, Pill, MethodBadge, SectionTitle, EmptyState } from '../components/UI'

const METHODS  = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const SAMPLE_BODIES = {
  POST: '{\n  "key": "value"\n}',
  PUT:  '{\n  "key": "updated"\n}',
  PATCH:'{\n  "key": "patched"\n}',
  GET:  '',
  DELETE: ''
}

export default function ApiTesting() {
  const { projectName, source } = useProject()

  // ── API Runner state ──────────────────────────────────
  const [method,  setMethod]  = useState('POST')
  const [url,     setUrl]     = useState('https://api.example.com/v1/endpoint')
  const [body,    setBody]    = useState(SAMPLE_BODIES.POST)
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}')
  const [tab,     setTab]     = useState('body')  // body | headers | response
  const [loading, setLoading] = useState(false)
  const [response,setResponse]= useState(null)

  // ── API test results from runs ────────────────────────
  const [results, setResults] = useState([])
  const [runs,    setRuns]    = useState([])
  const [selRun,  setSelRun]  = useState('')

  useEffect(() => {
    runAPI.list(source, 20).then(r => {
      setRuns(r || [])
      if (r?.length) {
        setSelRun(r[0].id)
        apiTestAPI.results({ runId: r[0].id }).then(d => setResults(d || []))
      }
    })
  }, [projectName, source])

  async function sendRequest() {
    setLoading(true)
    setResponse(null)
    const start = Date.now()
    try {
      let hdrs = { 'Content-Type': 'application/json' }
      try { hdrs = { ...hdrs, ...JSON.parse(headers) } } catch (_) {}

      const opts = { method, headers: hdrs }
      if (body && !['GET','DELETE'].includes(method)) opts.body = body

      const res  = await fetch(url, opts)
      const text = await res.text()
      let parsed; try { parsed = JSON.parse(text) } catch (_) { parsed = text }

      setResponse({
        status:   res.status,
        statusText: res.statusText,
        duration: Date.now() - start,
        body:     parsed,
        headers:  Object.fromEntries(res.headers.entries())
      })
    } catch (err) {
      setResponse({ error: err.message, duration: Date.now() - start })
    }
    setLoading(false)
  }

  function onRunChange(runId) {
    setSelRun(runId)
    apiTestAPI.results({ runId }).then(d => setResults(d || []))
  }

  const passed  = results.filter(r => r.passed).length
  const failed  = results.filter(r => !r.passed).length
  const avgTime = results.length
    ? Math.round(results.reduce((s, r) => s + (r.duration_ms || 0), 0) / results.length)
    : 0

  return (
    <div className="p-4">
      <PageHeader title="API testing" sub="REST client + automated API test results">
        <Badge color={source === 'local' ? 'teal' : 'blue'}>{source}</Badge>
      </PageHeader>

      {/* ── Inline REST Client ── */}
      <SectionTitle>REST client — send requests from dashboard</SectionTitle>
      <Card className="mb-4">
        <CardTitle>API runner</CardTitle>

        {/* URL bar */}
        <div className="flex gap-2 mb-3">
          <select
            value={method}
            onChange={e => { setMethod(e.target.value); setBody(SAMPLE_BODIES[e.target.value]) }}
            className="text-[11px] bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 font-medium w-20"
          >
            {METHODS.map(m => <option key={m}>{m}</option>)}
          </select>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://api.example.com/endpoint"
            className="flex-1 text-[11px] font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5"
          />
          <button
            onClick={sendRequest}
            disabled={loading}
            className="text-[11px] px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-2 border-b border-gray-100">
          {['body', 'headers', 'response'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-[10px] px-3 py-1.5 capitalize border-b-2 transition-colors ${
                tab === t ? 'border-blue-500 text-gray-900 font-medium' : 'border-transparent text-gray-400'
              }`}
            >
              {t}
              {t === 'response' && response && (
                <span className={`ml-1.5 text-[9px] px-1 rounded ${
                  response.error ? 'bg-red-100 text-red-700'
                  : response.status < 300 ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
                }`}>
                  {response.error ? 'ERR' : response.status}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'body' && (
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={['GET','DELETE'].includes(method) ? 'No body for ' + method : 'Request body (JSON)'}
            disabled={['GET','DELETE'].includes(method)}
            className="w-full h-28 text-[11px] font-mono bg-gray-50 border border-gray-100 rounded-lg p-2.5 resize-none disabled:opacity-40"
          />
        )}

        {tab === 'headers' && (
          <textarea
            value={headers}
            onChange={e => setHeaders(e.target.value)}
            className="w-full h-28 text-[11px] font-mono bg-gray-50 border border-gray-100 rounded-lg p-2.5 resize-none"
          />
        )}

        {tab === 'response' && (
          <>
            {!response ? (
              <EmptyState message="Send a request to see the response" />
            ) : response.error ? (
              <div className="bg-red-50 rounded-lg p-3 text-[11px] text-red-700">
                Error: {response.error} · {response.duration}ms
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Pill
                    status={response.status < 300 ? 'passed' : 'failed'}
                    label={`${response.status} ${response.statusText}`}
                  />
                  <span className="text-[10px] text-gray-400">{response.duration}ms</span>
                </div>
                <pre className="text-[10px] font-mono bg-gray-50 border border-gray-100 rounded-lg p-2.5 overflow-auto max-h-40 text-gray-700 whitespace-pre-wrap">
                  {typeof response.body === 'object'
                    ? JSON.stringify(response.body, null, 2)
                    : response.body}
                </pre>
              </div>
            )}
          </>
        )}
      </Card>

      {/* ── Automated API test suite results ── */}
      <SectionTitle live>API test suite results</SectionTitle>
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="bg-gray-50 rounded-lg p-2.5">
          <div className="text-[10px] text-gray-400">Total</div>
          <div className="text-lg font-medium">{results.length}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-2.5">
          <div className="text-[10px] text-green-600">Passed</div>
          <div className="text-lg font-medium text-green-700">{passed}</div>
        </div>
        <div className="bg-red-50 rounded-lg p-2.5">
          <div className="text-[10px] text-red-600">Failed</div>
          <div className="text-lg font-medium text-red-700">{failed}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5">
          <div className="text-[10px] text-gray-400">Avg time</div>
          <div className="text-lg font-medium">{avgTime}ms</div>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle>Test results</CardTitle>
          <select
            value={selRun}
            onChange={e => onRunChange(e.target.value)}
            className="text-[10px] bg-gray-50 border border-gray-200 rounded px-2 py-1"
          >
            {runs.map((r, i) => (
              <option key={r.id} value={r.id}>
                Run #{runs.length - i} · {new Date(r.started_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
        {results.length === 0 ? (
          <EmptyState message="No API test results yet. Use ATIDashboard.apiResult() in your tests." />
        ) : (
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] text-gray-400 border-b border-gray-100">
                <th className="text-left pb-2">Test</th>
                <th className="text-left pb-2">Endpoint</th>
                <th className="text-left pb-2">Method</th>
                <th className="text-left pb-2">Status</th>
                <th className="text-left pb-2">Time</th>
                <th className="text-left pb-2">Assertion</th>
                <th className="text-right pb-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50">
                  <td className="py-2 font-medium max-w-[120px] truncate">{r.test_name}</td>
                  <td className="py-2 font-mono text-[10px] text-gray-600 max-w-[140px] truncate">
                    {r.endpoint}
                  </td>
                  <td className="py-2"><MethodBadge method={r.method} /></td>
                  <td className="py-2">
                    <span className={`font-mono text-[10px] font-medium ${
                      r.status_code < 300 ? 'text-green-700'
                      : r.status_code < 500 ? 'text-amber-700' : 'text-red-700'
                    }`}>{r.status_code}</span>
                  </td>
                  <td className="py-2 text-gray-500">{r.duration_ms}ms</td>
                  <td className="py-2 text-[10px] text-gray-400 max-w-[120px] truncate">
                    {r.assertion || '—'}
                  </td>
                  <td className="py-2 text-right">
                    <Pill status={r.passed ? 'passed' : 'failed'} label={r.passed ? 'Pass' : 'Fail'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
