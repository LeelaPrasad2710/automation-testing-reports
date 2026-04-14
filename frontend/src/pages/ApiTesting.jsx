import { useEffect, useState } from 'react'
import { useProject } from '../App'
import { apiTestAPI, runAPI } from '../api'
import { Card, CardTitle, PageHeader, Badge, Pill, MethodBadge, SectionTitle, EmptyState } from '../components/UI'

const METHODS = ['POST','GET','PUT','PATCH','DELETE']

// Syntax highlight helpers — match HTML design
const Str = ({c}) => <span style={{color:'#3B6D11'}}>{c}</span>
const Kw  = ({c}) => <span style={{color:'#185FA5'}}>{c}</span>
const Fn  = ({c}) => <span style={{color:'#7F77DD'}}>{c}</span>
const Cmt = ({c}) => <span style={{color:'#888780'}}>{c}</span>

const codeBlockStyle = {
  background:'var(--color-bg-secondary, #f5f5f5)',
  border:'0.5px solid #e5e5e5',
  borderRadius:'6px',
  padding:'10px 12px',
  fontFamily:'monospace',
  fontSize:'10px',
  lineHeight:1.7,
  whiteSpace:'pre',
  overflowX:'auto',
  marginBottom:'8px'
}

export default function ApiTesting() {
  const { projectName, source } = useProject()

  // ── REST Client state ────────────────────────────────
  const [method,   setMethod]   = useState('POST')
  const [url,      setUrl]      = useState('https://api.ecommerce.com/v1/checkout/initiate')
  const [body,     setBody]     = useState('{\n  "userId": "usr_8821",\n  "cartId": "cart_4492",\n  "paymentMethod": "UPI",\n  "amount": 1299.00\n}')
  const [headers,  setHeaders]  = useState('{\n  "Content-Type": "application/json"\n}')
  const [clientTab,setClientTab]= useState('body')
  const [sending,  setSending]  = useState(false)
  const [response, setResponse] = useState(null)

  // ── API test suite state ─────────────────────────────
  const [results,  setResults]  = useState([])
  const [runs,     setRuns]     = useState([])
  const [selRun,   setSelRun]   = useState('')

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
    setSending(true); setResponse(null)
    const start = Date.now()
    try {
      let hdrs = {'Content-Type':'application/json'}
      try { hdrs = {...hdrs, ...JSON.parse(headers)} } catch(_) {}
      const opts = { method, headers: hdrs }
      if (body && !['GET','DELETE'].includes(method)) opts.body = body
      const res  = await fetch(url, opts)
      const text = await res.text()
      let parsed; try { parsed = JSON.parse(text) } catch(_) { parsed = text }
      setResponse({ status: res.status, statusText: res.statusText, duration: Date.now()-start, body: parsed })
    } catch(e) {
      setResponse({ error: e.message, duration: Date.now()-start })
    }
    setSending(false)
  }

  const passed = results.filter(r=>r.passed).length
  const failed = results.filter(r=>!r.passed).length
  const avgTime = results.length ? Math.round(results.reduce((s,r)=>s+(r.duration_ms||0),0)/results.length) : 0

  return (
    <div className="p-4">
      <PageHeader title="API testing" sub="REST client + automated API test results">
        <Badge color={source==='local'?'teal':'blue'}>{source}</Badge>
      </PageHeader>

      {/* ── REST Client ── */}
      <SectionTitle>REST client — send requests, see responses live</SectionTitle>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Card>
          <CardTitle sub="Send requests, see responses live">API test runner</CardTitle>
          <div className="flex gap-2 mb-3">
            <select value={method} onChange={e=>setMethod(e.target.value)}
              className="text-[11px] bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 font-medium w-20">
              {METHODS.map(m=><option key={m}>{m}</option>)}
            </select>
            <input type="text" value={url} onChange={e=>setUrl(e.target.value)}
              className="flex-1 text-[10px] font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5" />
            <button onClick={sendRequest} disabled={sending}
              className="text-[11px] px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50">
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
          {/* Body/Headers/Auth/Params tabs — matching HTML */}
          <div className="flex gap-0 mb-2 border-b border-gray-100">
            {['Body','Headers','Auth','Params'].map(t => (
              <button key={t} onClick={()=>setClientTab(t.toLowerCase())}
                className={`text-[10px] px-3 py-1.5 border-b-2 transition-colors ${
                  clientTab===t.toLowerCase()
                    ? 'border-blue-500 text-gray-900 font-medium'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}>{t}
              </button>
            ))}
          </div>
          {clientTab === 'body' && (
            <textarea value={body} onChange={e=>setBody(e.target.value)}
              disabled={['GET','DELETE'].includes(method)}
              className="w-full h-28 text-[11px] font-mono bg-gray-50 border border-gray-100 rounded-lg p-2.5 resize-none disabled:opacity-40" />
          )}
          {clientTab === 'headers' && (
            <textarea value={headers} onChange={e=>setHeaders(e.target.value)}
              className="w-full h-28 text-[11px] font-mono bg-gray-50 border border-gray-100 rounded-lg p-2.5 resize-none" />
          )}
          {(clientTab === 'auth' || clientTab === 'params') && (
            <div className="h-28 flex items-center justify-center text-[11px] text-gray-400">
              {clientTab === 'auth' ? 'Add Authorization header in Headers tab' : 'Add ?key=value in the URL'}
            </div>
          )}
          {/* Response */}
          {response && (
            <div className={`mt-3 rounded-lg p-3 border ${response.error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              {response.error ? (
                <div className="text-[11px] text-red-700">Error: {response.error} · {response.duration}ms</div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <Pill status={response.status<300?'passed':'failed'} label={`${response.status} ${response.statusText}`} />
                    <span className="text-[10px] text-gray-500">{response.duration}ms</span>
                    <span className="text-[10px] text-gray-400 ml-auto">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-[10px] font-mono bg-white border border-gray-200 rounded-lg p-2 overflow-auto max-h-32 text-gray-700 whitespace-pre-wrap">
                    {typeof response.body==='object' ? JSON.stringify(response.body,null,2) : response.body}
                  </pre>
                </>
              )}
            </div>
          )}
        </Card>

        {/* ── API test suite ── */}
        <Card>
          <CardTitle sub="Automated API test cases">API test suite</CardTitle>
          <div className="flex gap-2 flex-wrap mb-3">
            <Pill status="passed"  label={`${passed} passed`} />
            <Pill status="failed"  label={`${failed} failed`} />
            <Pill status="skipped" label={`${results.filter(r=>r.status_code===null).length} skipped`} />
            <span className="text-[10px] text-gray-400 ml-auto self-center">
              {runs[0] ? `Last run: ${new Date(runs[0].started_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}` : ''}
            </span>
          </div>
          {results.length === 0 ? (
            <EmptyState message="No API test results yet. Use ATIDashboard.apiResult() in your tests." />
          ) : (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[10px] text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2">API test</th>
                  <th className="text-left pb-2">Method</th>
                  <th className="text-left pb-2">Status</th>
                  <th className="text-left pb-2">Time</th>
                  <th className="text-right pb-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50">
                    <td className="py-1.5 font-mono text-[10px]">{r.endpoint}</td>
                    <td className="py-1.5"><MethodBadge method={r.method} /></td>
                    <td className="py-1.5">
                      <span className={`font-mono text-[10px] font-medium ${r.status_code<300?'text-green-700':r.status_code<500?'text-amber-700':'text-red-700'}`}>
                        {r.status_code}
                      </span>
                    </td>
                    <td className="py-1.5 text-gray-500">{r.duration_ms}ms</td>
                    <td className="py-1.5 text-right"><Pill status={r.passed?'passed':'failed'} label={r.passed?'Pass':'Fail'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* ── ATI REST API endpoints — matching HTML exactly ── */}
      <SectionTitle>ATI REST API — endpoints your projects call</SectionTitle>
      <Card className="mb-3">
        <CardTitle sub="Base URL: https://your-project.vercel.app">Available endpoints</CardTitle>
        {[
          { m:'POST', p:'/api/runs?action=start',    d:'Start a new run — sets source, project, env' },
          { m:'POST', p:'/api/runs?action=stop',     d:'Stop current run, finalise metrics' },
          { m:'POST', p:'/api/tests',                d:'Push single test result in real time' },
          { m:'POST', p:'/api/apitests',             d:'Push API test result to API testing panel' },
          { m:'GET',  p:'/api/project?resource=summary', d:'Get project-level metrics' },
          { m:'GET',  p:'/api/runs',                 d:'Get all runs for project' },
          { m:'GET',  p:'/api/tests',                d:'Get all test results for a run' },
          { m:'POST', p:'/api/bug?resource=bugs',    d:'Auto-raise bug from failed test' },
          { m:'GET',  p:'/api/members',              d:'Get team members and time logs' },
          { m:'GET',  p:'/api/health',               d:'Server health check' },
        ].map((row, i) => (
          <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-none">
            <MethodBadge method={row.m} />
            <span className="font-mono text-[10px] text-gray-900 flex-1">{row.p}</span>
            <span className="text-[10px] text-gray-400 w-52 text-right">{row.d}</span>
            <button className="text-[10px] px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 ml-1">
              Try it
            </button>
          </div>
        ))}
      </Card>

      {/* ── SDK payload cards — syntax highlighted, matching HTML ── */}
      <SectionTitle>How a single test result reaches the dashboard</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardTitle sub="POST /api/tests">What SDK sends after each test</CardTitle>
          <div style={codeBlockStyle}>
{`{
  `}<Str c={'"runId"'} />{`:      `}<Str c={'"L-2847"'} />{`,
  `}<Str c={'"testName"'} />{`:  `}<Str c={'"test_checkout_payment"'} />{`,
  `}<Str c={'"module"'} />{`:    `}<Str c={'"Checkout"'} />{`,
  `}<Str c={'"status"'} />{`:    `}<Str c={'"FAILED"'} />{`,
  `}<Str c={'"durationMs"'} />{`: 9412,
  `}<Str c={'"retryCount"'} />{`: 2,
  `}<Str c={'"errorMessage"'} />{`: `}<Str c={'"Timeout after 8000ms"'} />{`,
  `}<Str c={'"source"'} />{`:    `}<Str c={'"local"'} />{`,
  `}<Str c={'"browser"'} />{`:   `}<Str c={'"Chrome 124"'} />{`,
  `}<Str c={'"screenshotBase64"'} />{`: `}<Str c={'"base64..."'} />{`
}`}
          </div>
        </Card>
        <Card>
          <CardTitle sub="POST /api/apitests">What SDK sends for API tests</CardTitle>
          <div style={codeBlockStyle}>
{`{
  `}<Str c={'"runId"'} />{`:       `}<Str c={'"L-2847"'} />{`,
  `}<Str c={'"testName"'} />{`:   `}<Str c={'"Verify checkout initiate"'} />{`,
  `}<Str c={'"endpoint"'} />{`:   `}<Str c={'"checkout/initiate"'} />{`,
  `}<Str c={'"method"'} />{`:     `}<Str c={'"POST"'} />{`,
  `}<Str c={'"statusCode"'} />{`: 200,
  `}<Str c={'"durationMs"'} />{`: 142,
  `}<Str c={'"passed"'} />{`:     `}<Kw c={'true'} />{`,
  `}<Str c={'"assertion"'} />{`:  `}<Str c={'"status==200 && body.orderId!=null"'} />{`,
  `}<Str c={'"source"'} />{`:     `}<Str c={'"local"'} />{`
}`}
          </div>
        </Card>
      </div>
    </div>
  )
}
