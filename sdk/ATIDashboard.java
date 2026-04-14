package com.ati;

import java.io.*;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.atomic.*;

/**
 * ATI Dashboard Java SDK — Vercel Edition
 *
 * All API calls go directly to your Vercel deployment.
 * No Railway, no separate server needed.
 *
 * ── Quick start (TestNG) ────────────────────────────────
 *
 *   @BeforeSuite(alwaysRun = true)
 *   public void setUp() {
 *       ATIDashboard.start("ecommerce-project", "local");
 *   }
 *
 *   @AfterMethod(alwaysRun = true)
 *   public void afterTest(ITestResult result) {
 *       ATIDashboard.recordResult(result);
 *   }
 *
 *   @AfterSuite(alwaysRun = true)
 *   public void tearDown() {
 *       ATIDashboard.stop();
 *   }
 *
 * ── ENV vars ────────────────────────────────────────────
 *
 *   ATI_URL     = https://your-project.vercel.app   ← Vercel URL
 *   ATI_TOKEN   = your-project-token-from-supabase
 *   ATI_SOURCE  = local | cicd
 *   ATI_PROJECT = ecommerce-project
 *
 * ── GitHub Actions ──────────────────────────────────────
 *
 *   env:
 *     ATI_URL:    ${{ secrets.ATI_URL }}       ← Vercel URL
 *     ATI_TOKEN:  ${{ secrets.ATI_TOKEN }}
 *     ATI_SOURCE: cicd
 */
public class ATIDashboard {

  private static String  runId       = null;
  private static String  source      = "local";
  private static String  baseUrl     = null;
  private static String  token       = null;
  private static boolean enabled     = true;

  private static final AtomicInteger passed  = new AtomicInteger(0);
  private static final AtomicInteger failed  = new AtomicInteger(0);
  private static final AtomicInteger skipped = new AtomicInteger(0);
  private static long startMs = 0;

  private static final HttpClient HTTP = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(10)).build();

  // ── Public API ────────────────────────────────────────

  public static void start(String project, String src) {
    baseUrl = env("ATI_URL", "https://your-project.vercel.app").replaceAll("/$", "");
    token   = env("ATI_TOKEN", "");
    source  = env("ATI_SOURCE", src != null ? src : "local");
    enabled = !token.isEmpty();

    if (!enabled) { log("WARN: ATI_TOKEN not set — disabled."); return; }

    passed.set(0); failed.set(0); skipped.set(0);
    startMs = System.currentTimeMillis();

    Map<String, Object> body = new LinkedHashMap<>();
    body.put("source",      source);
    body.put("environment", env("ATI_ENV", "QA"));
    body.put("browser",     env("ATI_BROWSER", "unknown"));
    body.put("os",          System.getProperty("os.name", "unknown"));
    body.put("branch",      env("GITHUB_REF_NAME", env("GIT_BRANCH", "local")));
    body.put("triggeredBy", env("GITHUB_ACTOR", System.getProperty("user.name", "local")));

    // Vercel endpoint: POST /api/run/start
    String resp = post("/api/runs?action=start", body);
    if (resp != null) {
      runId = extractField(resp, "runId");
      log("Run started → " + runId + "  source=" + source);
    }
  }

  public static void start(String project) { start(project, null); }
  public static void start()               { start(env("ATI_PROJECT", "default"), null); }

  public static void stop() {
    if (!enabled || runId == null) return;

    Map<String, Object> body = new LinkedHashMap<>();
    body.put("runId",      runId);
    body.put("passed",     passed.get());
    body.put("failed",     failed.get());
    body.put("skipped",    skipped.get());
    body.put("durationMs", System.currentTimeMillis() - startMs);

    // Vercel endpoint: POST /api/run/stop
    post("/api/runs?action=stop", body);
    log("Run stopped → P=" + passed + " F=" + failed + " S=" + skipped);
    runId = null;
  }

  /** TestNG — call in @AfterMethod(alwaysRun=true) */
  public static void recordResult(Object iTestResult) {
    if (!enabled || runId == null) return;
    try {
      Class<?> cls    = iTestResult.getClass();
      String testName = (String) cls.getMethod("getName").invoke(iTestResult);
      int    status   = (int)    cls.getMethod("getStatus").invoke(iTestResult);
      long   start    = (long)   cls.getMethod("getStartMillis").invoke(iTestResult);
      long   end      = (long)   cls.getMethod("getEndMillis").invoke(iTestResult);

      String statusStr;
      switch (status) {
        case 1:  statusStr = "passed";  passed.incrementAndGet();  break;
        case 2:  statusStr = "failed";  failed.incrementAndGet();  break;
        default: statusStr = "skipped"; skipped.incrementAndGet(); break;
      }

      String error = null, stack = null;
      Throwable t = (Throwable) cls.getMethod("getThrowable").invoke(iTestResult);
      if (t != null) {
        error = t.getMessage();
        StringWriter sw = new StringWriter();
        t.printStackTrace(new PrintWriter(sw));
        stack = sw.toString();
      }

      sendTestResult(testName, guessModule(iTestResult), statusStr,
          (int)(end - start), 0, error, stack, null);
    } catch (Exception e) {
      log("WARN: recordResult failed: " + e.getMessage());
    }
  }

  /** Manual result — use when not on TestNG */
  public static void result(String name, String module, String status, int durationMs) {
    result(name, module, status, durationMs, 0, null, null, null);
  }

  public static void result(String name, String module, String status, int durationMs,
                             int retryCount, String error, String stack, String screenshotPath) {
    if (!enabled || runId == null) return;
    switch (status.toLowerCase()) {
      case "passed": case "pass":   passed.incrementAndGet();  break;
      case "failed": case "fail":   failed.incrementAndGet();  break;
      default:                       skipped.incrementAndGet(); break;
    }
    sendTestResult(name, module, status.toLowerCase(),
        durationMs, retryCount, error, stack, screenshotPath);
  }

  /** API test result — POST /api/api-test/result */
  public static void apiResult(String name, String endpoint, String method,
                                int statusCode, int durationMs,
                                boolean testPassed, String assertion) {
    if (!enabled || runId == null) return;
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("runId",      runId);
    body.put("testName",   name);
    body.put("endpoint",   endpoint);
    body.put("method",     method.toUpperCase());
    body.put("statusCode", statusCode);
    body.put("durationMs", durationMs);
    body.put("passed",     testPassed);
    body.put("assertion",  assertion);
    body.put("source",     source);
    post("/api/apitests", body);
  }

  // ── Internal ─────────────────────────────────────────

  private static void sendTestResult(String name, String module, String status,
                                      int durationMs, int retries,
                                      String error, String stack, String screenshotPath) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("runId",           runId);
    body.put("testName",        name);
    body.put("module",          module);
    body.put("status",          status);
    body.put("durationMs",      durationMs);
    body.put("retryCount",      retries);
    body.put("errorMessage",    error);
    body.put("stackTrace",      stack);
    body.put("source",          source);
    body.put("browser",         env("ATI_BROWSER", "unknown"));
    body.put("os",              System.getProperty("os.name"));
    body.put("failureCategory", detectCategory(error));

    if (screenshotPath != null) {
      try {
        byte[] bytes = Files.readAllBytes(Paths.get(screenshotPath));
        body.put("screenshotBase64", Base64.getEncoder().encodeToString(bytes));
      } catch (Exception ignored) {}
    }
    post("/api/tests", body);
  }

  private static String post(String path, Map<String, Object> body) {
    try {
      HttpRequest req = HttpRequest.newBuilder()
          .uri(URI.create(baseUrl + path))
          .header("Content-Type",  "application/json")
          .header("Authorization", "Bearer " + token)
          .POST(HttpRequest.BodyPublishers.ofString(toJson(body), StandardCharsets.UTF_8))
          .timeout(Duration.ofSeconds(15))
          .build();
      HttpResponse<String> resp = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
      if (resp.statusCode() >= 400)
        log("WARN: " + path + " returned HTTP " + resp.statusCode() + ": " + resp.body());
      return resp.body();
    } catch (Exception e) {
      log("WARN: API call failed (" + path + "): " + e.getMessage());
      return null;
    }
  }

  private static String detectCategory(String msg) {
    if (msg == null) return null;
    String m = msg.toLowerCase();
    if (m.contains("timeout"))       return "timeout";
    if (m.contains("nosuchelement") || m.contains("not found")) return "element_not_found";
    if (m.contains("assert")        || m.contains("expected"))  return "assertion";
    if (m.contains("connection")    || m.contains("network"))   return "network";
    return "other";
  }

  private static String guessModule(Object iTestResult) {
    try {
      Class<?> cls  = iTestResult.getClass();
      Object method = cls.getMethod("getMethod").invoke(iTestResult);
      Object tc     = method.getClass().getMethod("getTestClass").invoke(method);
      String name   = (String) tc.getClass().getMethod("getName").invoke(tc);
      String simple = name.substring(name.lastIndexOf('.') + 1);
      return simple.replace("Test", "").replace("Tests", "");
    } catch (Exception e) { return "General"; }
  }

  private static String extractField(String json, String key) {
    String search = "\"" + key + "\"";
    int i = json.indexOf(search);
    if (i < 0) return null;
    int colon = json.indexOf(':', i);
    int start = json.indexOf('"', colon + 1) + 1;
    int end   = json.indexOf('"', start);
    return (start > 0 && end > start) ? json.substring(start, end) : null;
  }

  private static String toJson(Map<String, Object> map) {
    StringBuilder sb = new StringBuilder("{");
    boolean first = true;
    for (Map.Entry<String, Object> e : map.entrySet()) {
      if (!first) sb.append(','); first = false;
      sb.append('"').append(e.getKey()).append('"').append(':');
      Object v = e.getValue();
      if (v == null)                          sb.append("null");
      else if (v instanceof Boolean || v instanceof Number) sb.append(v);
      else {
        String s = v.toString()
            .replace("\\","\\\\").replace("\"","\\\"")
            .replace("\n","\\n").replace("\r","\\r");
        sb.append('"').append(s).append('"');
      }
    }
    return sb.append('}').toString();
  }

  private static String env(String key, String fallback) {
    String v = System.getenv(key);
    return (v != null && !v.isEmpty()) ? v : fallback;
  }

  private static void log(String msg) { System.out.println("[ATI] " + msg); }
}
