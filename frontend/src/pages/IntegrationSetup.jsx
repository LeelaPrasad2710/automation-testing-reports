// IntegrationSetup.jsx
import { useState } from 'react'
import { Card, CardTitle, PageHeader, Badge, SectionTitle } from '../components/UI'

const TABS = ['Java / TestNG', 'Java / JUnit', 'Playwright JS', 'GitHub Actions', 'Jenkins']

const CODE = {
  'Java / TestNG': {
    lang: 'java',
    setup: `// 1. Add jar to your project (no Maven Central yet — use local jar)
// Copy ati-dashboard/sdk/java/ATIDashboard.java into your src/

// 2. Set env vars (or hardcode for quick test):
//   ATI_URL   = https://your-backend.railway.app
//   ATI_TOKEN = your-project-token
//   ATI_SOURCE = local

// 3. BaseTest.java
import com.ati.ATIDashboard;
import org.testng.ITestResult;
import org.testng.annotations.*;

public class BaseTest {

    @BeforeSuite(alwaysRun = true)
    public void suiteSetup() {
        ATIDashboard.start("ecommerce-project", "local");
    }

    @AfterMethod(alwaysRun = true)
    public void afterEachTest(ITestResult result) {
        ATIDashboard.recordResult(result);  // auto captures pass/fail/skip
    }

    @AfterSuite(alwaysRun = true)
    public void suiteTeardown() {
        ATIDashboard.stop();
    }
}

// 4. Your test extends BaseTest — nothing else changes
public class CheckoutTest extends BaseTest {
    @Test
    public void test_checkout_payment() {
        // your existing test code
    }
}`
  },
  'Java / JUnit': {
    lang: 'java',
    setup: `// JUnit 5 — use manual result() calls
import com.ati.ATIDashboard;
import org.junit.jupiter.api.*;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class CheckoutTest {

    @BeforeAll
    void setup() {
        ATIDashboard.start("ecommerce-project", "local");
    }

    @AfterEach
    void afterEach(TestInfo info, TestReporter reporter) {
        // JUnit 5 doesn't have ITestResult — use try/catch in each test
        // or use the ATIDashboard.result() manual method below
    }

    @AfterAll
    void teardown() {
        ATIDashboard.stop();
    }

    @Test
    void test_checkout_payment() {
        long start = System.currentTimeMillis();
        try {
            // ... test logic ...
            ATIDashboard.result("test_checkout_payment", "Checkout",
                "passed", (int)(System.currentTimeMillis() - start));
        } catch (Exception e) {
            ATIDashboard.result("test_checkout_payment", "Checkout",
                "failed", (int)(System.currentTimeMillis() - start),
                0, e.getMessage(), null, null);
            throw e;
        }
    }
}`
  },
  'Playwright JS': {
    lang: 'javascript',
    setup: `// playwright.config.js — add ATI as a reporter (zero other changes)
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['list'],
    ['./node_modules/ati-sdk/ati-sdk.js']  // or relative path
    // OR if you copied the file:
    // ['./ati-sdk.js']
  ],
  use: {
    screenshot: 'only-on-failure',  // ATI auto-uploads these
    video: 'off',
  }
});

// Set env vars before running:
// ATI_URL=https://your-backend.railway.app
// ATI_TOKEN=your-token
// ATI_SOURCE=local
// ATI_PROJECT=ecommerce-project

// Run normally:
// npx playwright test

// For manual control (e.g. in hooks):
const ATI = require('./ati-sdk');

// In global-setup.js:
module.exports = async () => {
  await ATI.start('ecommerce-project', 'local');
};

// In global-teardown.js:
module.exports = async () => {
  await ATI.stop();
};`
  },
  'GitHub Actions': {
    lang: 'yaml',
    setup: `# .github/workflows/regression.yml
name: Regression Suite

on:
  push:
    branches: [main, develop]
  pull_request:
  schedule:
    - cron: '0 6 * * *'   # Run daily at 6am

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Run ATI tests
        env:
          ATI_URL:     \${{ secrets.ATI_URL }}
          ATI_TOKEN:   \${{ secrets.ATI_TOKEN }}
          ATI_SOURCE:  cicd
          ATI_PROJECT: ecommerce-project
          ATI_ENV:     QA
          ATI_BROWSER: chrome-headless
        run: mvn test -Dsurefire.failIfNoSpecifiedTests=false

# Add secrets in:
# GitHub repo → Settings → Secrets and variables → Actions
# ATI_URL     = https://your-backend.railway.app
# ATI_TOKEN   = (from Supabase projects table)
#
# source=cicd  →  routes to CI/CD dashboard automatically`
  },
  'Jenkins': {
    lang: 'groovy',
    setup: `// Jenkinsfile
pipeline {
    agent any

    environment {
        ATI_URL     = credentials('ati-url')
        ATI_TOKEN   = credentials('ati-token')
        ATI_SOURCE  = 'cicd'
        ATI_PROJECT = 'ecommerce-project'
        ATI_ENV     = 'QA'
        ATI_BROWSER = 'chrome-headless'
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Run Tests') {
            steps {
                sh 'mvn clean test'
            }
            post {
                always {
                    junit 'target/surefire-reports/*.xml'
                    publishHTML([
                        allowMissing: false,
                        reportDir:   'target/surefire-reports',
                        reportFiles: 'index.html',
                        reportName:  'Test Report'
                    ])
                }
            }
        }
    }
}

// Add credentials in Jenkins:
// Manage Jenkins → Credentials → Global → Add Credentials
// ati-url   = https://your-backend.railway.app
// ati-token = (from Supabase projects table)`
  }
}

export default function IntegrationSetup() {
  const [activeTab, setActiveTab] = useState('Java / TestNG')
  const current = CODE[activeTab]

  return (
    <div className="p-4">
      <PageHeader title="Integration setup" sub="Connect your test project to ATI Dashboard in minutes">
        <Badge color="green">3 lines minimum</Badge>
      </PageHeader>

      {/* How it works */}
      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="text-xs font-medium text-blue-800 mb-2">How it works — 4 steps</div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { n:'1', title:'Create project',  sub:'Run Supabase SQL — get your ATI_TOKEN from the projects table' },
            { n:'2', title:'Deploy backend',  sub:'Push backend/ to Railway — get your ATI_URL' },
            { n:'3', title:'Add to project',  sub:'3 lines in your BaseTest — set ATI_URL, ATI_TOKEN env vars' },
            { n:'4', title:'Run tests',        sub:'Dashboard updates live as tests execute. Local and CI/CD separate.' },
          ].map(s => (
            <div key={s.n} className="flex gap-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 text-[10px] font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                {s.n}
              </div>
              <div>
                <div className="text-[11px] font-medium text-blue-800">{s.title}</div>
                <div className="text-[10px] text-blue-600 mt-0.5 leading-tight">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code tabs */}
      <SectionTitle>Code snippets — pick your stack</SectionTitle>
      <div className="flex gap-0 mb-0 border-b border-gray-200 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[10px] px-3 py-2 whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-gray-900 font-medium'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <Card className="rounded-t-none border-t-0">
        <pre className="text-[10px] font-mono text-gray-700 whitespace-pre overflow-x-auto leading-relaxed bg-gray-50 rounded-lg p-4 max-h-96">
          {current?.setup}
        </pre>
      </Card>

      {/* Env vars reference */}
      <SectionTitle>Environment variables reference</SectionTitle>
      <Card>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-[10px] text-gray-400 border-b border-gray-100">
              <th className="text-left pb-2">Variable</th>
              <th className="text-left pb-2">Required</th>
              <th className="text-left pb-2">Example</th>
              <th className="text-left pb-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {[
              { v:'ATI_URL',     req:true,  ex:'https://ati.railway.app',      note:'Your Railway backend URL' },
              { v:'ATI_TOKEN',   req:true,  ex:'a3f9c2d1...',                  note:'From Supabase projects table' },
              { v:'ATI_PROJECT', req:false, ex:'ecommerce-project',            note:'Defaults to "default"' },
              { v:'ATI_SOURCE',  req:false, ex:'local | cicd',                 note:'Determines which dashboard tab' },
              { v:'ATI_ENV',     req:false, ex:'QA | UAT | Prod',              note:'Environment label' },
              { v:'ATI_BROWSER', req:false, ex:'Chrome | Firefox | headless',  note:'Browser label for display' },
            ].map(row => (
              <tr key={row.v} className="border-b border-gray-50 last:border-none">
                <td className="py-2 font-mono text-[10px] text-blue-700">{row.v}</td>
                <td className="py-2">
                  <span className={`text-[10px] font-medium ${row.req ? 'text-red-600' : 'text-gray-400'}`}>
                    {row.req ? 'Required' : 'Optional'}
                  </span>
                </td>
                <td className="py-2 font-mono text-[10px] text-gray-600">{row.ex}</td>
                <td className="py-2 text-gray-500">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Quick test */}
      <SectionTitle>Quick health check — verify your backend is running</SectionTitle>
      <Card>
        <div className="text-[10px] text-gray-500 mb-2">Run this in your terminal to confirm your backend is alive:</div>
        <pre className="text-[11px] font-mono bg-gray-900 text-green-400 rounded-lg p-3 overflow-x-auto">
{`curl https://your-backend.railway.app/health
# Expected: {"status":"ok","version":"1.0.0"}

# Test auth with your token:
curl -H "Authorization: Bearer YOUR_TOKEN" \\
     https://your-backend.railway.app/api/v1/projects/summary`}
        </pre>
      </Card>
    </div>
  )
}
