/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  [EXAMINER] EXAM SIMULATOR                                                   ║
 * ║  ═══════════════════════════════════════════════════════════════════════════ ║
 * ║                                                                              ║
 * ║  Component:   Architect Certification Exam Simulator                         ║
 * ║  Purpose:     Automated grading and auto-fail detection                      ║
 * ║  Duration:    4 hours (240 minutes)                                          ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface ExamState {
  candidateId: string;
  startTime: Date;
  endTime: Date | null;
  phase: "triage" | "diagnosis" | "recovery" | "validation" | "closeout";
  status: "in_progress" | "passed" | "failed" | "auto_failed";
  
  // Incident state
  ledgerSyncRestored: boolean;
  syncRestoredAt: Date | null;
  queueProcessed: number;
  queueTotal: number;
  discrepanciesResolved: number;
  discrepanciesTotal: number;
  
  // Communication state
  headersSet: {
    incidentStatus: boolean;
    degradedService: boolean;
    retryAfter: boolean;
    requestId: boolean;
  };
  
  // Scoring
  scores: {
    ledgerSync: number;
    dataIntegrity: number;
    communication: number;
  };
  
  // Auto-fail tracking
  autoFailTriggered: boolean;
  autoFailReason: string | null;
  
  // Audit log
  actions: ExamAction[];
}

export interface ExamAction {
  timestamp: Date;
  action: string;
  details: Record<string, unknown>;
  flagged: boolean;
  flagReason?: string;
}

export interface GradingResult {
  candidateId: string;
  examDate: string;
  duration: number; // minutes
  
  scores: {
    ledgerSync: {
      rootCause: number;
      recoveryStrategy: number;
      syncRestoration: number;
      queueProcessing: number;
      subtotal: number;
    };
    dataIntegrity: {
      noDataLoss: number;
      reconciliation: number;
      auditTrail: number;
      rollbackSafety: number;
      subtotal: number;
    };
    communication: {
      incidentStatusHeader: number;
      degradedServiceHeader: number;
      retryAfterHeader: number;
      requestIdCorrelation: number;
      subtotal: number;
    };
  };
  
  totalScore: number;
  passingScore: number;
  passed: boolean;
  autoFailed: boolean;
  autoFailReason: string | null;
  
  certificationLevel: "architect" | "engineer" | "operator" | "none";
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: AUTO-FAIL DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

const PII_PATTERNS = [
  // Email addresses
  { name: "email", pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  // SSN
  { name: "ssn", pattern: /\d{3}-\d{2}-\d{4}/g },
  // Phone numbers
  { name: "phone", pattern: /\+?1?[-.]?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g },
  // Credit card numbers
  { name: "credit_card", pattern: /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g },
];

const SECRET_PATTERNS = [
  // API keys
  { name: "api_key", pattern: /(pk|sk)_[a-zA-Z0-9]{32,}/g },
  // JWT tokens
  { name: "jwt", pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g },
  // Connection strings with passwords
  { name: "connection_string", pattern: /postgresql:\/\/[^:]+:[^@]+@[^\s]+/g },
  // Generic password patterns
  { name: "password", pattern: /password["']?\s*[:=]\s*["'][^"']+["']/gi },
  // AWS keys
  { name: "aws_key", pattern: /AKIA[0-9A-Z]{16}/g },
  // Private keys
  { name: "private_key", pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/g },
];

export function detectPIIExposure(content: string): { detected: boolean; matches: string[] } {
  const matches: string[] = [];
  
  for (const { name, pattern } of PII_PATTERNS) {
    const found = content.match(pattern);
    if (found) {
      matches.push(`${name}: ${found.length} instance(s)`);
    }
  }
  
  return {
    detected: matches.length > 0,
    matches,
  };
}

export function detectSecretExposure(content: string): { detected: boolean; matches: string[] } {
  const matches: string[] = [];
  
  for (const { name, pattern } of SECRET_PATTERNS) {
    const found = content.match(pattern);
    if (found) {
      matches.push(`${name}: ${found.length} instance(s)`);
    }
  }
  
  return {
    detected: matches.length > 0,
    matches,
  };
}

export function checkAutoFail(
  action: string,
  content: string
): { triggered: boolean; reason: string | null } {
  // Check for PII exposure
  const piiCheck = detectPIIExposure(content);
  if (piiCheck.detected) {
    return {
      triggered: true,
      reason: `PII Exposure detected in ${action}: ${piiCheck.matches.join(", ")}`,
    };
  }
  
  // Check for secret exposure
  const secretCheck = detectSecretExposure(content);
  if (secretCheck.detected) {
    return {
      triggered: true,
      reason: `Secret Exposure detected in ${action}: ${secretCheck.matches.join(", ")}`,
    };
  }
  
  return { triggered: false, reason: null };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: GRADING ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export function gradeExam(state: ExamState): GradingResult {
  const duration = state.endTime
    ? (state.endTime.getTime() - state.startTime.getTime()) / 60000
    : 240;

  // Calculate Ledger Sync scores
  const ledgerSyncScores = gradeLedgerSync(state);
  
  // Calculate Data Integrity scores
  const dataIntegrityScores = gradeDataIntegrity(state);
  
  // Calculate Communication scores
  const communicationScores = gradeCommunication(state);
  
  const totalScore =
    ledgerSyncScores.subtotal +
    dataIntegrityScores.subtotal +
    communicationScores.subtotal;

  const passed = totalScore >= 95 && !state.autoFailTriggered;

  return {
    candidateId: state.candidateId,
    examDate: state.startTime.toISOString(),
    duration,
    scores: {
      ledgerSync: ledgerSyncScores,
      dataIntegrity: dataIntegrityScores,
      communication: communicationScores,
    },
    totalScore,
    passingScore: 95,
    passed,
    autoFailed: state.autoFailTriggered,
    autoFailReason: state.autoFailReason,
    certificationLevel: determineCertificationLevel(totalScore, state.autoFailTriggered),
  };
}

function gradeLedgerSync(state: ExamState): {
  rootCause: number;
  recoveryStrategy: number;
  syncRestoration: number;
  queueProcessing: number;
  subtotal: number;
} {
  // Root cause identification (10 points)
  // This would be graded by proctor based on candidate's diagnosis
  const rootCause = 0; // Placeholder - proctor fills in
  
  // Recovery strategy (10 points)
  const recoveryStrategy = 0; // Placeholder - proctor fills in
  
  // Sync restoration (15 points)
  let syncRestoration = 0;
  if (state.ledgerSyncRestored && state.syncRestoredAt) {
    const timeToRestore =
      (state.syncRestoredAt.getTime() - state.startTime.getTime()) / 60000;
    if (timeToRestore <= 120) {
      syncRestoration = 15;
    } else if (timeToRestore <= 180) {
      syncRestoration = 12;
    } else {
      syncRestoration = 8;
    }
  }
  
  // Queue processing (5 points)
  let queueProcessing = 0;
  const queuePercentage = state.queueProcessed / state.queueTotal;
  if (queuePercentage >= 1) {
    queueProcessing = 5;
  } else if (queuePercentage >= 0.9) {
    queueProcessing = 3;
  } else if (queuePercentage >= 0.5) {
    queueProcessing = 1;
  }
  
  return {
    rootCause,
    recoveryStrategy,
    syncRestoration,
    queueProcessing,
    subtotal: rootCause + recoveryStrategy + syncRestoration + queueProcessing,
  };
}

function gradeDataIntegrity(state: ExamState): {
  noDataLoss: number;
  reconciliation: number;
  auditTrail: number;
  rollbackSafety: number;
  subtotal: number;
} {
  // No data loss (15 points)
  // Check if all transactions were preserved
  const dataLossPercentage = 1 - (state.queueProcessed / state.queueTotal);
  let noDataLoss = 0;
  if (dataLossPercentage === 0) {
    noDataLoss = 15;
  } else if (dataLossPercentage < 0.001) {
    noDataLoss = 10;
  } else if (dataLossPercentage < 0.01) {
    noDataLoss = 5;
  }
  
  // Reconciliation (10 points)
  const reconciliationPercentage =
    state.discrepanciesResolved / state.discrepanciesTotal;
  let reconciliation = 0;
  if (reconciliationPercentage >= 1) {
    reconciliation = 10;
  } else if (reconciliationPercentage >= 0.95) {
    reconciliation = 8;
  } else if (reconciliationPercentage >= 0.75) {
    reconciliation = 5;
  } else if (reconciliationPercentage >= 0.5) {
    reconciliation = 2;
  }
  
  // Audit trail (10 points) - based on action logging
  const auditTrail = state.actions.length > 0 ? 10 : 0;
  
  // Rollback safety (5 points) - placeholder for proctor
  const rollbackSafety = 0;
  
  return {
    noDataLoss,
    reconciliation,
    auditTrail,
    rollbackSafety,
    subtotal: noDataLoss + reconciliation + auditTrail + rollbackSafety,
  };
}

function gradeCommunication(state: ExamState): {
  incidentStatusHeader: number;
  degradedServiceHeader: number;
  retryAfterHeader: number;
  requestIdCorrelation: number;
  subtotal: number;
} {
  const incidentStatusHeader = state.headersSet.incidentStatus ? 8 : 0;
  const degradedServiceHeader = state.headersSet.degradedService ? 6 : 0;
  const retryAfterHeader = state.headersSet.retryAfter ? 4 : 0;
  const requestIdCorrelation = state.headersSet.requestId ? 2 : 0;
  
  return {
    incidentStatusHeader,
    degradedServiceHeader,
    retryAfterHeader,
    requestIdCorrelation,
    subtotal:
      incidentStatusHeader +
      degradedServiceHeader +
      retryAfterHeader +
      requestIdCorrelation,
  };
}

function determineCertificationLevel(
  score: number,
  autoFailed: boolean
): "architect" | "engineer" | "operator" | "none" {
  if (autoFailed) return "none";
  if (score >= 95) return "architect";
  if (score >= 90) return "engineer";
  if (score >= 85) return "operator";
  return "none";
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: EXAM SIMULATOR
// ═══════════════════════════════════════════════════════════════════════════════

export class ArchitectExamSimulator {
  private state: ExamState;
  private onAutoFail?: (reason: string) => void;
  
  constructor(candidateId: string, onAutoFail?: (reason: string) => void) {
    this.onAutoFail = onAutoFail;
    this.state = {
      candidateId,
      startTime: new Date(),
      endTime: null,
      phase: "triage",
      status: "in_progress",
      ledgerSyncRestored: false,
      syncRestoredAt: null,
      queueProcessed: 0,
      queueTotal: 12847,
      discrepanciesResolved: 0,
      discrepanciesTotal: 342,
      headersSet: {
        incidentStatus: false,
        degradedService: false,
        retryAfter: false,
        requestId: false,
      },
      scores: {
        ledgerSync: 0,
        dataIntegrity: 0,
        communication: 0,
      },
      autoFailTriggered: false,
      autoFailReason: null,
      actions: [],
    };
  }
  
  // Record an action and check for auto-fail
  recordAction(action: string, details: Record<string, unknown>): void {
    // Convert details to string for scanning
    const contentToScan = JSON.stringify(details);
    
    // Check for auto-fail conditions
    const autoFailCheck = checkAutoFail(action, contentToScan);
    
    const examAction: ExamAction = {
      timestamp: new Date(),
      action,
      details,
      flagged: autoFailCheck.triggered,
      flagReason: autoFailCheck.reason || undefined,
    };
    
    this.state.actions.push(examAction);
    
    if (autoFailCheck.triggered && !this.state.autoFailTriggered) {
      this.state.autoFailTriggered = true;
      this.state.autoFailReason = autoFailCheck.reason;
      this.state.status = "auto_failed";
      
      if (this.onAutoFail) {
        this.onAutoFail(autoFailCheck.reason!);
      }
    }
  }
  
  // Simulate setting incident headers
  setIncidentHeader(header: string, value: string): void {
    this.recordAction("set_header", { header, value });
    
    switch (header.toLowerCase()) {
      case "x-incident-status":
        this.state.headersSet.incidentStatus = true;
        break;
      case "x-degraded-service":
        this.state.headersSet.degradedService = true;
        break;
      case "x-retry-after":
        this.state.headersSet.retryAfter = true;
        break;
      case "x-request-id":
        this.state.headersSet.requestId = true;
        break;
    }
  }
  
  // Simulate restoring ledger sync
  restoreLedgerSync(): void {
    this.recordAction("restore_ledger_sync", {});
    this.state.ledgerSyncRestored = true;
    this.state.syncRestoredAt = new Date();
    this.state.phase = "validation";
  }
  
  // Simulate processing queue
  processQueue(count: number): void {
    this.recordAction("process_queue", { count });
    this.state.queueProcessed = Math.min(
      this.state.queueProcessed + count,
      this.state.queueTotal
    );
  }
  
  // Simulate resolving discrepancies
  resolveDiscrepancy(count: number): void {
    this.recordAction("resolve_discrepancy", { count });
    this.state.discrepanciesResolved = Math.min(
      this.state.discrepanciesResolved + count,
      this.state.discrepanciesTotal
    );
  }
  
  // End the exam
  endExam(): GradingResult {
    this.state.endTime = new Date();
    
    if (!this.state.autoFailTriggered) {
      const result = gradeExam(this.state);
      this.state.status = result.passed ? "passed" : "failed";
      return result;
    }
    
    return gradeExam(this.state);
  }
  
  // Get current state
  getState(): ExamState {
    return { ...this.state };
  }
  
  // Get elapsed time in minutes
  getElapsedTime(): number {
    const now = new Date();
    return (now.getTime() - this.state.startTime.getTime()) / 60000;
  }
  
  // Check if exam time has expired
  isExpired(): boolean {
    return this.getElapsedTime() >= 240;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  PII_PATTERNS,
  SECRET_PATTERNS,
};
