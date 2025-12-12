/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  [SIMULATOR] LAB ARTIFACT                                                    ║
 * ║  ═══════════════════════════════════════════════════════════════════════════ ║
 * ║                                                                              ║
 * ║  Lab:         C300-LATENCY-STRESS                                            ║
 * ║  Title:       Latency Stress Test & Bottleneck Identification                ║
 * ║  Duration:    90 minutes                                                     ║
 * ║  Difficulty:  █████████░ 90%                                                ║
 * ║                                                                              ║
 * ║  Standards:                                                                  ║
 * ║  • Nvidia: Optimization and latency are graded                               ║
 * ║  • Palantir: Security is paramount                                           ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface LatencyTestConfig {
  baseUrl: string;
  apiKey: string;
  organizationId: string;
  concurrency: number;
  requestsPerEndpoint: number;
}

export interface EndpointMetrics {
  endpoint: string;
  method: string;
  samples: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  stdDev: number;
  errorRate: number;
  throughput: number;
}

export interface BottleneckAnalysis {
  endpoint: string;
  issue: string;
  severity: "low" | "medium" | "high" | "critical";
  recommendation: string;
  evidence: Record<string, unknown>;
}

export interface StressTestReport {
  testId: string;
  startTime: string;
  endTime: string;
  config: LatencyTestConfig;
  endpoints: EndpointMetrics[];
  bottlenecks: BottleneckAnalysis[];
  overallScore: number;
  passed: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: LATENCY THRESHOLDS (NVIDIA STANDARD)
// ═══════════════════════════════════════════════════════════════════════════════

export const LATENCY_THRESHOLDS = {
  // Read operations
  "GET /api/assets": {
    p50: 50,
    p95: 150,
    p99: 300,
    errorRate: 0.1,
  },
  "GET /api/assets/:id": {
    p50: 30,
    p95: 100,
    p99: 200,
    errorRate: 0.1,
  },
  "GET /api/verifications": {
    p50: 50,
    p95: 150,
    p99: 300,
    errorRate: 0.1,
  },

  // Write operations
  "POST /api/assets": {
    p50: 100,
    p95: 300,
    p99: 500,
    errorRate: 0.5,
  },
  "PUT /api/assets/:id": {
    p50: 80,
    p95: 250,
    p99: 400,
    errorRate: 0.5,
  },
  "DELETE /api/assets/:id": {
    p50: 50,
    p95: 150,
    p99: 300,
    errorRate: 0.5,
  },

  // Complex operations
  "POST /api/verifications": {
    p50: 150,
    p95: 400,
    p99: 800,
    errorRate: 1.0,
  },
  "POST /api/graphql": {
    p50: 100,
    p95: 300,
    p99: 600,
    errorRate: 0.5,
  },

  // Default for unlisted endpoints
  default: {
    p50: 100,
    p95: 300,
    p99: 500,
    errorRate: 1.0,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: TEST ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

interface TestEndpoint {
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: (config: LatencyTestConfig) => Record<string, unknown>;
  requiresSetup?: boolean;
}

const TEST_ENDPOINTS: TestEndpoint[] = [
  // Read operations
  {
    name: "List Assets",
    method: "GET",
    path: "/api/assets?limit=20",
  },
  {
    name: "Get Single Asset",
    method: "GET",
    path: "/api/assets/:assetId",
    requiresSetup: true,
  },
  {
    name: "List Verifications",
    method: "GET",
    path: "/api/verifications?limit=20",
  },
  {
    name: "Search Assets",
    method: "GET",
    path: "/api/assets?search=test&limit=10",
  },

  // Write operations
  {
    name: "Create Asset",
    method: "POST",
    path: "/api/assets",
    body: (config) => ({
      name: `Stress Test Asset ${Date.now()}`,
      category: "stress_test",
      organizationId: config.organizationId,
    }),
  },
  {
    name: "Update Asset",
    method: "PUT",
    path: "/api/assets/:assetId",
    body: () => ({
      name: `Updated Asset ${Date.now()}`,
    }),
    requiresSetup: true,
  },

  // Complex operations
  {
    name: "Request Verification",
    method: "POST",
    path: "/api/verifications",
    body: (config) => ({
      assetId: ":assetId",
      type: "EXISTENCE",
      organizationId: config.organizationId,
    }),
    requiresSetup: true,
  },
  {
    name: "GraphQL Query",
    method: "POST",
    path: "/api/graphql",
    body: (config) => ({
      query: `
        query StressTest {
          assets(organizationId: "${config.organizationId}", first: 10) {
            edges {
              node {
                id
                name
                status
              }
            }
          }
        }
      `,
    }),
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: LATENCY STRESS TESTER
// ═══════════════════════════════════════════════════════════════════════════════

class LatencyStressTester {
  private config: LatencyTestConfig;
  private setupAssetId: string | null = null;
  private results: Map<string, number[]> = new Map();
  private errors: Map<string, number> = new Map();

  constructor(config: LatencyTestConfig) {
    this.config = config;
  }

  async setup(): Promise<void> {
    console.log("\n📦 Setting up test fixtures...");

    // Create a test asset for operations that need one
    const response = await this.makeRequest("POST", "/api/assets", {
      name: "Stress Test Fixture",
      category: "stress_test",
      organizationId: this.config.organizationId,
    });

    if (response.ok) {
      const data = (await response.json()) as { data?: { id?: string } };
      this.setupAssetId = data.data?.id || null;
      console.log(`   Created fixture asset: ${this.setupAssetId}`);
    } else {
      throw new Error("Failed to create test fixture");
    }
  }

  async cleanup(): Promise<void> {
    console.log("\n🧹 Cleaning up test fixtures...");

    if (this.setupAssetId) {
      await this.makeRequest("DELETE", `/api/assets/${this.setupAssetId}`);
      console.log(`   Deleted fixture asset: ${this.setupAssetId}`);
    }
  }

  private async makeRequest(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<Response> {
    const url = `${this.config.baseUrl}${path}`;

    return fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
        "X-Organization-Id": this.config.organizationId,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  private resolvePath(path: string): string {
    return path.replace(":assetId", this.setupAssetId || "unknown");
  }

  private resolveBody(
    body: Record<string, unknown> | undefined
  ): Record<string, unknown> | undefined {
    if (!body) return undefined;

    const resolved = { ...body };
    for (const key of Object.keys(resolved)) {
      if (resolved[key] === ":assetId") {
        resolved[key] = this.setupAssetId;
      }
    }
    return resolved;
  }

  async testEndpoint(endpoint: TestEndpoint): Promise<EndpointMetrics> {
    const key = `${endpoint.method} ${endpoint.path}`;
    const latencies: number[] = [];
    let errorCount = 0;

    console.log(`\n🔬 Testing: ${endpoint.name}`);
    console.log(`   ${endpoint.method} ${endpoint.path}`);
    console.log(`   Concurrency: ${this.config.concurrency}`);
    console.log(`   Requests: ${this.config.requestsPerEndpoint}`);

    const startTime = Date.now();

    // Run requests in batches based on concurrency
    const batches = Math.ceil(
      this.config.requestsPerEndpoint / this.config.concurrency
    );

    for (let batch = 0; batch < batches; batch++) {
      const batchSize = Math.min(
        this.config.concurrency,
        this.config.requestsPerEndpoint - batch * this.config.concurrency
      );

      const promises = Array.from({ length: batchSize }, async () => {
        const reqStart = performance.now();

        try {
          const path = this.resolvePath(endpoint.path);
          const body = endpoint.body
            ? this.resolveBody(endpoint.body(this.config))
            : undefined;

          const response = await this.makeRequest(endpoint.method, path, body);
          const latency = performance.now() - reqStart;

          latencies.push(latency);

          if (!response.ok) {
            errorCount++;
          }
        } catch {
          const latency = performance.now() - reqStart;
          latencies.push(latency);
          errorCount++;
        }
      });

      await Promise.all(promises);

      // Progress indicator
      const progress = Math.round(
        ((batch + 1) / batches) * 100
      );
      process.stdout.write(`\r   Progress: ${progress}%`);
    }

    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`\n   Completed in ${totalTime.toFixed(2)}s`);

    // Calculate metrics
    const sorted = [...latencies].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / sorted.length;
    const variance =
      sorted.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) /
      sorted.length;

    const metrics: EndpointMetrics = {
      endpoint: key,
      method: endpoint.method,
      samples: latencies.length,
      min: sorted[0] || 0,
      max: sorted[sorted.length - 1] || 0,
      avg,
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
      stdDev: Math.sqrt(variance),
      errorRate: (errorCount / latencies.length) * 100,
      throughput: latencies.length / totalTime,
    };

    this.results.set(key, latencies);
    this.errors.set(key, errorCount);

    return metrics;
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] || 0;
  }

  analyzeBottlenecks(metrics: EndpointMetrics[]): BottleneckAnalysis[] {
    const bottlenecks: BottleneckAnalysis[] = [];

    for (const m of metrics) {
      const thresholds =
        LATENCY_THRESHOLDS[m.endpoint as keyof typeof LATENCY_THRESHOLDS] ||
        LATENCY_THRESHOLDS.default;

      // Check P50
      if (m.p50 > thresholds.p50 * 2) {
        bottlenecks.push({
          endpoint: m.endpoint,
          issue: `P50 latency (${m.p50.toFixed(0)}ms) exceeds threshold (${thresholds.p50}ms) by 2x`,
          severity: "high",
          recommendation:
            "Check database query performance, add indexes, or implement caching",
          evidence: { p50: m.p50, threshold: thresholds.p50 },
        });
      } else if (m.p50 > thresholds.p50) {
        bottlenecks.push({
          endpoint: m.endpoint,
          issue: `P50 latency (${m.p50.toFixed(0)}ms) exceeds threshold (${thresholds.p50}ms)`,
          severity: "medium",
          recommendation: "Optimize query or add caching layer",
          evidence: { p50: m.p50, threshold: thresholds.p50 },
        });
      }

      // Check P95
      if (m.p95 > thresholds.p95 * 2) {
        bottlenecks.push({
          endpoint: m.endpoint,
          issue: `P95 latency (${m.p95.toFixed(0)}ms) exceeds threshold (${thresholds.p95}ms) by 2x`,
          severity: "critical",
          recommendation:
            "Investigate connection pool exhaustion or database locks",
          evidence: { p95: m.p95, threshold: thresholds.p95 },
        });
      } else if (m.p95 > thresholds.p95) {
        bottlenecks.push({
          endpoint: m.endpoint,
          issue: `P95 latency (${m.p95.toFixed(0)}ms) exceeds threshold (${thresholds.p95}ms)`,
          severity: "high",
          recommendation: "Check for N+1 queries or missing indexes",
          evidence: { p95: m.p95, threshold: thresholds.p95 },
        });
      }

      // Check P99
      if (m.p99 > thresholds.p99 * 2) {
        bottlenecks.push({
          endpoint: m.endpoint,
          issue: `P99 latency (${m.p99.toFixed(0)}ms) exceeds threshold (${thresholds.p99}ms) by 2x`,
          severity: "critical",
          recommendation:
            "Implement circuit breaker, increase timeouts, or scale infrastructure",
          evidence: { p99: m.p99, threshold: thresholds.p99 },
        });
      }

      // Check error rate
      if (m.errorRate > thresholds.errorRate * 5) {
        bottlenecks.push({
          endpoint: m.endpoint,
          issue: `Error rate (${m.errorRate.toFixed(2)}%) exceeds threshold (${thresholds.errorRate}%) by 5x`,
          severity: "critical",
          recommendation:
            "Check rate limiting, authentication, or server errors",
          evidence: { errorRate: m.errorRate, threshold: thresholds.errorRate },
        });
      } else if (m.errorRate > thresholds.errorRate) {
        bottlenecks.push({
          endpoint: m.endpoint,
          issue: `Error rate (${m.errorRate.toFixed(2)}%) exceeds threshold (${thresholds.errorRate}%)`,
          severity: "high",
          recommendation: "Investigate error logs for root cause",
          evidence: { errorRate: m.errorRate, threshold: thresholds.errorRate },
        });
      }

      // Check for high variance (unstable performance)
      if (m.stdDev > m.avg) {
        bottlenecks.push({
          endpoint: m.endpoint,
          issue: `High latency variance (stdDev: ${m.stdDev.toFixed(0)}ms > avg: ${m.avg.toFixed(0)}ms)`,
          severity: "medium",
          recommendation:
            "Investigate intermittent issues like GC pauses or connection pool contention",
          evidence: { stdDev: m.stdDev, avg: m.avg },
        });
      }
    }

    return bottlenecks;
  }

  calculateScore(
    metrics: EndpointMetrics[],
    bottlenecks: BottleneckAnalysis[]
  ): number {
    let score = 100;

    // Deduct for bottlenecks
    for (const b of bottlenecks) {
      switch (b.severity) {
        case "critical":
          score -= 20;
          break;
        case "high":
          score -= 10;
          break;
        case "medium":
          score -= 5;
          break;
        case "low":
          score -= 2;
          break;
      }
    }

    // Bonus for exceptional performance
    for (const m of metrics) {
      const thresholds =
        LATENCY_THRESHOLDS[m.endpoint as keyof typeof LATENCY_THRESHOLDS] ||
        LATENCY_THRESHOLDS.default;

      if (m.p99 < thresholds.p50) {
        score += 2; // Bonus for P99 under P50 threshold
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  async runFullTest(): Promise<StressTestReport> {
    const testId = `stress-${Date.now()}`;
    const startTime = new Date().toISOString();

    console.log("\n" + "═".repeat(80));
    console.log("🚀 LATENCY STRESS TEST INITIATED");
    console.log("═".repeat(80));
    console.log(`Test ID: ${testId}`);
    console.log(`Target: ${this.config.baseUrl}`);
    console.log(`Concurrency: ${this.config.concurrency}`);
    console.log(`Requests per endpoint: ${this.config.requestsPerEndpoint}`);

    await this.setup();

    const endpointMetrics: EndpointMetrics[] = [];

    for (const endpoint of TEST_ENDPOINTS) {
      if (endpoint.requiresSetup && !this.setupAssetId) {
        console.log(`\n⏭️  Skipping ${endpoint.name} (no fixture available)`);
        continue;
      }

      const metrics = await this.testEndpoint(endpoint);
      endpointMetrics.push(metrics);

      // Print summary
      console.log(`   P50: ${metrics.p50.toFixed(0)}ms`);
      console.log(`   P95: ${metrics.p95.toFixed(0)}ms`);
      console.log(`   P99: ${metrics.p99.toFixed(0)}ms`);
      console.log(`   Error Rate: ${metrics.errorRate.toFixed(2)}%`);
    }

    await this.cleanup();

    const bottlenecks = this.analyzeBottlenecks(endpointMetrics);
    const score = this.calculateScore(endpointMetrics, bottlenecks);
    const passed = score >= 95;

    const report: StressTestReport = {
      testId,
      startTime,
      endTime: new Date().toISOString(),
      config: this.config,
      endpoints: endpointMetrics,
      bottlenecks,
      overallScore: score,
      passed,
    };

    // Print final report
    console.log("\n" + "═".repeat(80));
    console.log("📊 STRESS TEST REPORT");
    console.log("═".repeat(80));

    console.log("\n📈 Endpoint Summary:");
    console.log(
      "┌────────────────────────────────┬────────┬────────┬────────┬────────┐"
    );
    console.log(
      "│ Endpoint                       │ P50    │ P95    │ P99    │ Errors │"
    );
    console.log(
      "├────────────────────────────────┼────────┼────────┼────────┼────────┤"
    );

    for (const m of endpointMetrics) {
      const name = m.endpoint.substring(0, 30).padEnd(30);
      const p50 = `${m.p50.toFixed(0)}ms`.padStart(6);
      const p95 = `${m.p95.toFixed(0)}ms`.padStart(6);
      const p99 = `${m.p99.toFixed(0)}ms`.padStart(6);
      const err = `${m.errorRate.toFixed(1)}%`.padStart(6);
      console.log(`│ ${name} │ ${p50} │ ${p95} │ ${p99} │ ${err} │`);
    }

    console.log(
      "└────────────────────────────────┴────────┴────────┴────────┴────────┘"
    );

    if (bottlenecks.length > 0) {
      console.log("\n⚠️  Bottlenecks Identified:");
      for (const b of bottlenecks) {
        const icon =
          b.severity === "critical"
            ? "🔴"
            : b.severity === "high"
            ? "🟠"
            : b.severity === "medium"
            ? "🟡"
            : "🟢";
        console.log(`   ${icon} [${b.severity.toUpperCase()}] ${b.endpoint}`);
        console.log(`      Issue: ${b.issue}`);
        console.log(`      Fix: ${b.recommendation}`);
      }
    }

    console.log("\n" + "═".repeat(80));
    console.log(`📊 FINAL SCORE: ${score}/100`);
    console.log(`📋 STATUS: ${passed ? "✅ PASSED" : "❌ FAILED"}`);
    console.log("═".repeat(80));

    return report;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: EXPORTS & CLI
// ═══════════════════════════════════════════════════════════════════════════════

export async function runLatencyStressTest(
  config: LatencyTestConfig
): Promise<StressTestReport> {
  const tester = new LatencyStressTester(config);
  return tester.runFullTest();
}

// CLI execution
if (require.main === module) {
  const config: LatencyTestConfig = {
    baseUrl: process.env.API_URL || "http://localhost:3000",
    apiKey: process.env.API_KEY || "",
    organizationId: process.env.ORG_ID || "",
    concurrency: parseInt(process.env.CONCURRENCY || "10"),
    requestsPerEndpoint: parseInt(process.env.REQUESTS || "100"),
  };

  if (!config.apiKey || !config.organizationId) {
    console.error("❌ Missing required environment variables:");
    console.error("   API_KEY - Your API key");
    console.error("   ORG_ID - Your organization ID");
    process.exit(1);
  }

  runLatencyStressTest(config)
    .then((report) => {
      process.exit(report.passed ? 0 : 1);
    })
    .catch((error) => {
      console.error("❌ Test failed with error:", error);
      process.exit(1);
    });
}

export { LatencyStressTester, LATENCY_THRESHOLDS, TEST_ENDPOINTS };
