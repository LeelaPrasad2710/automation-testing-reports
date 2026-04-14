'use strict'

/**
 * ATI SDK — JavaScript / Playwright — Vercel Edition
 *
 * playwright.config.js:
 *   reporter: [['list'], ['./ati-sdk.js']]
 *
 * ENV vars:
 *   ATI_URL    = https://your-project.vercel.app   ← Vercel URL
 *   ATI_TOKEN  = your-token
 *   ATI_SOURCE = local | cicd
 */
const ATI = {
  runId: null, source: 'local', baseUrl: null, token: null,
  enabled: false, passed: 0, failed: 0, skipped: 0, startMs: 0,

  _init(project, src) {
    this.baseUrl = (process.env.ATI_URL || 'https://your-project.vercel.app').replace(/\/$/, '')
    this.token   = process.env.ATI_TOKEN || ''
    this.source  = process.env.ATI_SOURCE || src || 'local'
    this.enabled = !!this.token
    if (!this.enabled) console.log('[ATI] WARN: ATI_TOKEN not set — disabled.')
  },

  async start(project, src) {
    this._init(project, src)
    if (!this.enabled) return
    this.passed = 0; this.failed = 0; this.skipped = 0
    this.startMs = Date.now()
    const res = await this._post('/api/run/start', {
      source:      this.source,
      environment: process.env.ATI_ENV     || 'QA',
      browser:     process.env.ATI_BROWSER || 'chromium',
      os:          process.platform,
      branch:      process.env.GITHUB_REF_NAME || 'local',
      triggeredBy: process.env.GITHUB_ACTOR   || process.env.USER || 'local'
    })
    if (res?.runId) {
      this.runId = res.runId
      console.log(`[ATI] Run started → ${this.runId} [${this.source}]`)
    }
  },

  async stop() {
    if (!this.enabled || !this.runId) return
    await this._post('/api/run/stop', {
      runId: this.runId, passed: this.passed,
      failed: this.failed, skipped: this.skipped,
      durationMs: Date.now() - this.startMs
    })
    console.log(`[ATI] Run stopped → P=${this.passed} F=${this.failed} S=${this.skipped}`)
    this.runId = null
  },

  async result(name, module, status, durationMs, retryCount=0,
               errorMessage=null, stackTrace=null, screenshotPath=null) {
    if (!this.enabled || !this.runId) return
    const s = status.toLowerCase()
    if (s.startsWith('pass'))        this.passed++
    else if (s.startsWith('fail'))   this.failed++
    else                             this.skipped++
    const body = {
      runId: this.runId, testName: name, module,
      status: s.startsWith('pass') ? 'passed' : s.startsWith('fail') ? 'failed' : 'skipped',
      durationMs, retryCount, errorMessage, stackTrace,
      source: this.source, browser: process.env.ATI_BROWSER || 'chromium',
      os: process.platform, failureCategory: this._cat(errorMessage)
    }
    if (screenshotPath) {
      try { body.screenshotBase64 = require('fs').readFileSync(screenshotPath).toString('base64') }
      catch(_) {}
    }
    await this._post('/api/test/result', body)
  },

  async apiResult(name, endpoint, method, statusCode, durationMs, passed, assertion=null) {
    if (!this.enabled || !this.runId) return
    await this._post('/api/api-test/result', {
      runId: this.runId, testName: name, endpoint,
      method: method.toUpperCase(), statusCode, durationMs, passed, assertion,
      source: this.source
    })
  },

  // ── Playwright Reporter hooks ─────────────────────────
  async onBegin() {
    await this.start(process.env.ATI_PROJECT || 'playwright', process.env.ATI_SOURCE || 'local')
  },
  async onTestEnd(test, result) {
    const status = result.status === 'passed' ? 'passed'
                 : result.status === 'failed' ? 'failed' : 'skipped'
    const parts  = test.location?.file?.split(/[/\\]/) || []
    const module = parts.length > 1
      ? parts[parts.length-2].replace(/[-_]/g,' ').replace(/\b\w/g, c=>c.toUpperCase())
      : 'General'
    const ss = result.attachments?.find(a => a.name === 'screenshot')
    await this.result(test.title, module, status, result.duration, result.retry,
      result.error?.message, result.error?.stack, ss?.path || null)
  },
  async onEnd() { await this.stop() },

  // ── Helpers ───────────────────────────────────────────
  async _post(path, body) {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method:  'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${this.token}` },
        body:    JSON.stringify(body),
        signal:  AbortSignal.timeout(15000)
      })
      return res.ok ? res.json() : null
    } catch(e) {
      console.log(`[ATI] WARN: ${path} failed: ${e.message}`)
      return null
    }
  },
  _cat(msg) {
    if (!msg) return null
    const m = msg.toLowerCase()
    if (m.includes('timeout'))  return 'timeout'
    if (m.includes('locator') || m.includes('element')) return 'element_not_found'
    if (m.includes('expect')  || m.includes('assert'))  return 'assertion'
    if (m.includes('network') || m.includes('fetch'))   return 'network'
    return 'other'
  }
}

module.exports = ATI
