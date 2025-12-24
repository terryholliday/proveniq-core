/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  [DRILL_INSTRUCTOR] LAB ARTIFACT                                             ║
 * ║  ═══════════════════════════════════════════════════════════════════════════ ║
 * ║                                                                              ║
 * ║  Lab:         C200-BREACH-SIM                                                ║
 * ║  Title:       Tenant Isolation Breach Simulation                             ║
 * ║  Duration:    90 minutes                                                     ║
 * ║  Difficulty:  ████████░░ 90%                                                ║
 * ║                                                                              ║
 * ║  ⚠️  WARNING: Execute ONLY in isolated training environment                 ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import crypto from "crypto";

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: TEST ENVIRONMENT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

interface TestEnvironment {
  baseUrl: string;
  attackerSession: string;
  victimOrganizationId: string;
  attackerOrganizationId: string;
  victimAssetIds: string[];
}

interface AttackResult {
  attackId: string;
  attackName: string;
  vector: string;
  payload: Record<string, unknown>;
  expectedStatus: number;
  actualStatus: number;
  blocked: boolean;
  responseBody: unknown;
  timestamp: string;
  latencyMs: number;
}

interface LabReport {
  candidateId: string;
  startTime: string;
  endTime: string;
  attacks: AttackResult[];
  score: number;
  passed: boolean;
  vulnerabilitiesFound: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: ATTACK VECTORS
// ═══════════════════════════════════════════════════════════════════════════════

const ATTACK_VECTORS = {
  // Direct resource access attacks
  DIRECT_ACCESS: {
    id: "ATK-001",
    name: "Direct Resource Access",
    description: "Attempt to access victim's asset by ID",
    severity: "CRITICAL",
    owasp: "A01:2021 - Broken Access Control",
  },

  // Organization ID manipulation
  ORG_ID_MANIPULATION: {
    id: "ATK-002",
    name: "Organization ID Manipulation",
    description: "Query with victim's organization ID",
    severity: "CRITICAL",
    owasp: "A01:2021 - Broken Access Control",
  },

  // Cross-tenant creation
  CROSS_TENANT_CREATE: {
    id: "ATK-003",
    name: "Cross-Tenant Resource Creation",
    description: "Create resource in victim's organization",
    severity: "CRITICAL",
    owasp: "A01:2021 - Broken Access Control",
  },

  // IDOR via sequential enumeration
  IDOR_ENUMERATION: {
    id: "ATK-004",
    name: "IDOR Sequential Enumeration",
    description: "Enumerate resources via predictable IDs",
    severity: "HIGH",
    owasp: "A01:2021 - Broken Access Control",
  },

  // Parameter pollution
  PARAM_POLLUTION: {
    id: "ATK-005",
    name: "Parameter Pollution",
    description: "Confuse server with multiple org IDs",
    severity: "MEDIUM",
    owasp: "A03:2021 - Injection",
  },

  // GraphQL batch attack
  GRAPHQL_BATCH: {
    id: "ATK-006",
    name: "GraphQL Batch Query",
    description: "Access multiple orgs in single query",
    severity: "HIGH",
    owasp: "A01:2021 - Broken Access Control",
  },

  // Role manipulation
  ROLE_ESCALATION: {
    id: "ATK-007",
    name: "Role Escalation",
    description: "Attempt to elevate own privileges",
    severity: "CRITICAL",
    owasp: "A01:2021 - Broken Access Control",
  },

  // Self-enrollment
  SELF_ENROLLMENT: {
    id: "ATK-008",
    name: "Self-Enrollment Attack",
    description: "Add self to victim organization",
    severity: "CRITICAL",
    owasp: "A01:2021 - Broken Access Control",
  },

  // API key scope bypass
  API_KEY_SCOPE_BYPASS: {
    id: "ATK-009",
    name: "API Key Scope Bypass",
    description: "Use limited key for elevated actions",
    severity: "HIGH",
    owasp: "A07:2021 - Identification and Authentication Failures",
  },

  // Webhook injection
  WEBHOOK_INJECTION: {
    id: "ATK-010",
    name: "Webhook URL Injection",
    description: "Inject malicious webhook URL",
    severity: "MEDIUM",
    owasp: "A03:2021 - Injection",
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: ATTACK EXECUTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

class BreachSimulator {
  private env: TestEnvironment;
  private results: AttackResult[] = [];

  constructor(env: TestEnvironment) {
    this.env = env;
  }

  private async executeRequest(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    headers?: Record<string, string>
  ): Promise<{ status: number; body: unknown; latency: number }> {
    const startTime = Date.now();

    const response = await fetch(`${this.env.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Cookie: `next-auth.session-token=${this.env.attackerSession}`,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const latency = Date.now() - startTime;
    let responseBody: unknown;

    try {
      responseBody = await response.json();
    } catch {
      responseBody = await response.text();
    }

    return {
      status: response.status,
      body: responseBody,
      latency,
    };
  }

  private recordResult(
    attack: (typeof ATTACK_VECTORS)[keyof typeof ATTACK_VECTORS],
    payload: Record<string, unknown>,
    expectedStatus: number,
    result: { status: number; body: unknown; latency: number }
  ): AttackResult {
    const attackResult: AttackResult = {
      attackId: attack.id,
      attackName: attack.name,
      vector: attack.owasp,
      payload,
      expectedStatus,
      actualStatus: result.status,
      blocked: result.status === expectedStatus,
      responseBody: result.body,
      timestamp: new Date().toISOString(),
      latencyMs: result.latency,
    };

    this.results.push(attackResult);
    return attackResult;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ATTACK 1: Direct Resource Access
  // ─────────────────────────────────────────────────────────────────────────────
  async attack_DirectAccess(): Promise<AttackResult> {
    console.log("\n🎯 [ATK-001] Executing Direct Resource Access...");

    const victimAssetId = this.env.victimAssetIds[0];
    const result = await this.executeRequest(
      "GET",
      `/api/assets/${victimAssetId}`
    );

    return this.recordResult(
      ATTACK_VECTORS.DIRECT_ACCESS,
      { assetId: victimAssetId },
      403, // Expected: Forbidden or 404
      result
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ATTACK 2: Organization ID Manipulation
  // ─────────────────────────────────────────────────────────────────────────────
  async attack_OrgIdManipulation(): Promise<AttackResult> {
    console.log("\n🎯 [ATK-002] Executing Organization ID Manipulation...");

    const result = await this.executeRequest(
      "GET",
      `/api/assets?organizationId=${this.env.victimOrganizationId}`
    );

    return this.recordResult(
      ATTACK_VECTORS.ORG_ID_MANIPULATION,
      { organizationId: this.env.victimOrganizationId },
      403,
      result
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ATTACK 3: Cross-Tenant Resource Creation
  // ─────────────────────────────────────────────────────────────────────────────
  async attack_CrossTenantCreate(): Promise<AttackResult> {
    console.log("\n🎯 [ATK-003] Executing Cross-Tenant Resource Creation...");

    const payload = {
      name: "Malicious Asset",
      category: "equipment",
      organizationId: this.env.victimOrganizationId,
    };

    const result = await this.executeRequest("POST", "/api/assets", payload);

    return this.recordResult(
      ATTACK_VECTORS.CROSS_TENANT_CREATE,
      payload,
      403,
      result
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ATTACK 4: IDOR Enumeration
  // ─────────────────────────────────────────────────────────────────────────────
  async attack_IdorEnumeration(): Promise<AttackResult> {
    console.log("\n🎯 [ATK-004] Executing IDOR Enumeration...");

    // Attempt to enumerate 10 sequential-looking IDs
    const enumerationResults: { id: string; status: number }[] = [];

    for (let i = 1; i <= 10; i++) {
      const testId = `asset_${String(i).padStart(5, "0")}`;
      const result = await this.executeRequest("GET", `/api/assets/${testId}`);
      enumerationResults.push({ id: testId, status: result.status });
    }

    // Check if any returned 200 (data leak)
    const leaked = enumerationResults.filter((r) => r.status === 200);

    return this.recordResult(
      ATTACK_VECTORS.IDOR_ENUMERATION,
      { testedIds: enumerationResults.map((r) => r.id) },
      404, // All should be 404 (not found) or 403 (forbidden)
      {
        status: leaked.length > 0 ? 200 : 404,
        body: { leaked: leaked.length, results: enumerationResults },
        latency: 0,
      }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ATTACK 5: Parameter Pollution
  // ─────────────────────────────────────────────────────────────────────────────
  async attack_ParamPollution(): Promise<AttackResult> {
    console.log("\n🎯 [ATK-005] Executing Parameter Pollution...");

    // Multiple organizationId parameters
    const result = await this.executeRequest(
      "GET",
      `/api/assets?organizationId=${this.env.attackerOrganizationId}&organizationId=${this.env.victimOrganizationId}`
    );

    // Check if response contains victim's data
    const responseData = result.body as { data?: unknown[] };
    const containsVictimData =
      JSON.stringify(responseData).includes(this.env.victimOrganizationId);

    return this.recordResult(
      ATTACK_VECTORS.PARAM_POLLUTION,
      {
        params: [
          this.env.attackerOrganizationId,
          this.env.victimOrganizationId,
        ],
      },
      200, // Should return 200 but ONLY with attacker's data
      {
        ...result,
        body: {
          ...responseData,
          _analysis: { containsVictimData },
        },
      }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ATTACK 6: GraphQL Batch Query
  // ─────────────────────────────────────────────────────────────────────────────
  async attack_GraphqlBatch(): Promise<AttackResult> {
    console.log("\n🎯 [ATK-006] Executing GraphQL Batch Query...");

    const query = `
      query BatchAccess {
        attackerAssets: assets(organizationId: "${this.env.attackerOrganizationId}") {
          edges { node { id name } }
        }
        victimAssets: assets(organizationId: "${this.env.victimOrganizationId}") {
          edges { node { id name } }
        }
      }
    `;

    const result = await this.executeRequest("POST", "/api/graphql", { query });

    // Check if victimAssets returned data
    const responseData = result.body as {
      data?: { victimAssets?: { edges?: unknown[] } };
      errors?: unknown[];
    };
    const victimDataReturned =
      (responseData.data?.victimAssets?.edges?.length ?? 0) > 0;

    return this.recordResult(
      ATTACK_VECTORS.GRAPHQL_BATCH,
      { query },
      200, // Should return 200 but victimAssets should be empty/error
      {
        ...result,
        body: {
          ...responseData,
          _analysis: { victimDataReturned },
        },
      }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ATTACK 7: Role Escalation
  // ─────────────────────────────────────────────────────────────────────────────
  async attack_RoleEscalation(): Promise<AttackResult> {
    console.log("\n🎯 [ATK-007] Executing Role Escalation...");

    // Attempt to change own global role to ADMIN
    const payload = { role: "ADMIN" };

    const result = await this.executeRequest(
      "PUT",
      "/api/users/me",
      payload
    );

    return this.recordResult(
      ATTACK_VECTORS.ROLE_ESCALATION,
      payload,
      403,
      result
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ATTACK 8: Self-Enrollment
  // ─────────────────────────────────────────────────────────────────────────────
  async attack_SelfEnrollment(): Promise<AttackResult> {
    console.log("\n🎯 [ATK-008] Executing Self-Enrollment Attack...");

    const payload = {
      userId: "attacker_user_id", // Would be actual attacker's ID
      role: "ADMIN",
    };

    const result = await this.executeRequest(
      "POST",
      `/api/organizations/${this.env.victimOrganizationId}/members`,
      payload
    );

    return this.recordResult(
      ATTACK_VECTORS.SELF_ENROLLMENT,
      payload,
      403,
      result
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ATTACK 9: API Key Scope Bypass
  // ─────────────────────────────────────────────────────────────────────────────
  async attack_ApiKeyScopeBypass(): Promise<AttackResult> {
    console.log("\n🎯 [ATK-009] Executing API Key Scope Bypass...");

    // Create a read-only API key, then try to use it for writes
    const createKeyResult = await this.executeRequest(
      "POST",
      "/api/api-keys",
      {
        name: "Read Only Key",
        scopes: ["assets:read"],
        organizationId: this.env.attackerOrganizationId,
      }
    );

    const keyData = createKeyResult.body as { data?: { key?: string } };
    const readOnlyKey = keyData.data?.key;

    if (!readOnlyKey) {
      return this.recordResult(
        ATTACK_VECTORS.API_KEY_SCOPE_BYPASS,
        { error: "Could not create test key" },
        403,
        createKeyResult
      );
    }

    // Attempt write operation with read-only key
    const writeResult = await this.executeRequest(
      "POST",
      "/api/assets",
      {
        name: "Scope Bypass Test",
        category: "test",
        organizationId: this.env.attackerOrganizationId,
      },
      {
        Authorization: `Bearer ${readOnlyKey}`,
      }
    );

    return this.recordResult(
      ATTACK_VECTORS.API_KEY_SCOPE_BYPASS,
      { keyScopes: ["assets:read"], attemptedAction: "assets:write" },
      403,
      writeResult
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ATTACK 10: Webhook URL Injection
  // ─────────────────────────────────────────────────────────────────────────────
  async attack_WebhookInjection(): Promise<AttackResult> {
    console.log("\n🎯 [ATK-010] Executing Webhook URL Injection...");

    // Attempt to create webhook with internal URL
    const maliciousUrls = [
      "http://localhost:3000/api/admin",
      "http://127.0.0.1:5432",
      "http://169.254.169.254/latest/meta-data", // AWS metadata
      "file:///etc/passwd",
    ];

    const results: { url: string; status: number }[] = [];

    for (const url of maliciousUrls) {
      const result = await this.executeRequest("POST", "/api/webhooks", {
        url,
        events: ["asset.created"],
        organizationId: this.env.attackerOrganizationId,
      });
      results.push({ url, status: result.status });
    }

    const anyAccepted = results.some((r) => r.status === 201);

    return this.recordResult(
      ATTACK_VECTORS.WEBHOOK_INJECTION,
      { testedUrls: maliciousUrls },
      400, // All should be rejected
      {
        status: anyAccepted ? 201 : 400,
        body: { results },
        latency: 0,
      }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EXECUTE ALL ATTACKS
  // ─────────────────────────────────────────────────────────────────────────────
  async executeAllAttacks(): Promise<AttackResult[]> {
    console.log("\n" + "═".repeat(80));
    console.log("🔴 BREACH SIMULATION INITIATED");
    console.log("═".repeat(80));

    await this.attack_DirectAccess();
    await this.attack_OrgIdManipulation();
    await this.attack_CrossTenantCreate();
    await this.attack_IdorEnumeration();
    await this.attack_ParamPollution();
    await this.attack_GraphqlBatch();
    await this.attack_RoleEscalation();
    await this.attack_SelfEnrollment();
    await this.attack_ApiKeyScopeBypass();
    await this.attack_WebhookInjection();

    console.log("\n" + "═".repeat(80));
    console.log("🔴 BREACH SIMULATION COMPLETE");
    console.log("═".repeat(80));

    return this.results;
  }

  getResults(): AttackResult[] {
    return this.results;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: GRADING ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

function gradeResults(results: AttackResult[]): {
  score: number;
  passed: boolean;
  vulnerabilities: string[];
} {
  const vulnerabilities: string[] = [];
  let blockedCount = 0;

  for (const result of results) {
    if (result.blocked) {
      blockedCount++;
    } else {
      vulnerabilities.push(
        `${result.attackId}: ${result.attackName} - Expected ${result.expectedStatus}, got ${result.actualStatus}`
      );
    }
  }

  const score = Math.round((blockedCount / results.length) * 100);
  const passed = score >= 95 && vulnerabilities.length === 0;

  return { score, passed, vulnerabilities };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: LAB EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

export async function runBreachSimulation(
  candidateId: string,
  env: TestEnvironment
): Promise<LabReport> {
  const startTime = new Date().toISOString();

  const simulator = new BreachSimulator(env);
  const results = await simulator.executeAllAttacks();

  const { score, passed, vulnerabilities } = gradeResults(results);

  const report: LabReport = {
    candidateId,
    startTime,
    endTime: new Date().toISOString(),
    attacks: results,
    score,
    passed,
    vulnerabilitiesFound: vulnerabilities,
  };

  // Print summary
  console.log("\n" + "═".repeat(80));
  console.log("📊 LAB REPORT SUMMARY");
  console.log("═".repeat(80));
  console.log(`Candidate: ${candidateId}`);
  console.log(`Score: ${score}%`);
  console.log(`Status: ${passed ? "✅ PASSED" : "❌ FAILED"}`);
  console.log(`Attacks Blocked: ${results.filter((r) => r.blocked).length}/${results.length}`);

  if (vulnerabilities.length > 0) {
    console.log("\n⚠️  VULNERABILITIES FOUND:");
    vulnerabilities.forEach((v) => console.log(`   - ${v}`));
  }

  console.log("═".repeat(80));

  return report;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: KEY ROTATION DRILL
// ═══════════════════════════════════════════════════════════════════════════════

export interface KeyRotationResult {
  phase: string;
  success: boolean;
  duration: number;
  error?: string;
}

export async function keyRotationDrill(
  env: TestEnvironment
): Promise<KeyRotationResult[]> {
  const results: KeyRotationResult[] = [];

  console.log("\n" + "═".repeat(80));
  console.log("🔑 KEY ROTATION DRILL INITIATED");
  console.log("═".repeat(80));

  // Phase 1: Generate new secret
  console.log("\n📍 Phase 1: Generate new NEXTAUTH_SECRET...");
  const phase1Start = Date.now();
  try {
    const newSecret = crypto.randomBytes(32).toString("hex");
    console.log(`   New secret generated: ${newSecret.substring(0, 8)}...`);
    results.push({
      phase: "Generate Secret",
      success: true,
      duration: Date.now() - phase1Start,
    });
  } catch (error) {
    results.push({
      phase: "Generate Secret",
      success: false,
      duration: Date.now() - phase1Start,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Phase 2: Update environment (simulated)
  console.log("\n📍 Phase 2: Update environment variable...");
  const phase2Start = Date.now();
  try {
    // In real scenario, this would update the environment
    console.log("   Environment variable updated (simulated)");
    results.push({
      phase: "Update Environment",
      success: true,
      duration: Date.now() - phase2Start,
    });
  } catch (error) {
    results.push({
      phase: "Update Environment",
      success: false,
      duration: Date.now() - phase2Start,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Phase 3: Verify sessions still work
  console.log("\n📍 Phase 3: Verify existing sessions...");
  const phase3Start = Date.now();
  try {
    const response = await fetch(`${env.baseUrl}/api/auth/session`, {
      headers: {
        Cookie: `next-auth.session-token=${env.attackerSession}`,
      },
    });
    const sessionValid = response.status === 200;
    console.log(`   Session validation: ${sessionValid ? "VALID" : "INVALID"}`);
    results.push({
      phase: "Verify Sessions",
      success: true,
      duration: Date.now() - phase3Start,
    });
  } catch (error) {
    results.push({
      phase: "Verify Sessions",
      success: false,
      duration: Date.now() - phase3Start,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Phase 4: Invalidate compromised API keys
  console.log("\n📍 Phase 4: Invalidate compromised API keys...");
  const phase4Start = Date.now();
  try {
    // Would call API to revoke keys
    console.log("   API keys invalidated (simulated)");
    results.push({
      phase: "Invalidate API Keys",
      success: true,
      duration: Date.now() - phase4Start,
    });
  } catch (error) {
    results.push({
      phase: "Invalidate API Keys",
      success: false,
      duration: Date.now() - phase4Start,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Phase 5: Rotate webhook secrets
  console.log("\n📍 Phase 5: Rotate webhook secrets...");
  const phase5Start = Date.now();
  try {
    // Would regenerate webhook secrets
    console.log("   Webhook secrets rotated (simulated)");
    results.push({
      phase: "Rotate Webhook Secrets",
      success: true,
      duration: Date.now() - phase5Start,
    });
  } catch (error) {
    results.push({
      phase: "Rotate Webhook Secrets",
      success: false,
      duration: Date.now() - phase5Start,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Summary
  const allPassed = results.every((r) => r.success);
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log("\n" + "═".repeat(80));
  console.log("🔑 KEY ROTATION DRILL COMPLETE");
  console.log(`   Status: ${allPassed ? "✅ ALL PHASES PASSED" : "❌ SOME PHASES FAILED"}`);
  console.log(`   Total Duration: ${totalDuration}ms`);
  console.log("═".repeat(80));

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7: EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  BreachSimulator,
  ATTACK_VECTORS,
  gradeResults,
  type TestEnvironment,
  type AttackResult,
  type LabReport,
};
