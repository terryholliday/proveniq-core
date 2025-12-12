export interface ComplianceConfig {
  gdpr: {
    enabled: boolean;
    dataRetentionDays: number;
    consentRequired: boolean;
    rightToErasure: boolean;
    dataPortability: boolean;
  };
  ccpa: {
    enabled: boolean;
    doNotSell: boolean;
    disclosureRequired: boolean;
  };
  soc2: {
    enabled: boolean;
    auditLogging: boolean;
    encryptionAtRest: boolean;
    encryptionInTransit: boolean;
    accessControls: boolean;
  };
  hipaa: {
    enabled: boolean;
    phi: boolean;
    auditTrail: boolean;
    accessLogging: boolean;
  };
}

export const DEFAULT_COMPLIANCE_CONFIG: ComplianceConfig = {
  gdpr: {
    enabled: true,
    dataRetentionDays: 365,
    consentRequired: true,
    rightToErasure: true,
    dataPortability: true,
  },
  ccpa: {
    enabled: true,
    doNotSell: true,
    disclosureRequired: true,
  },
  soc2: {
    enabled: true,
    auditLogging: true,
    encryptionAtRest: true,
    encryptionInTransit: true,
    accessControls: true,
  },
  hipaa: {
    enabled: false,
    phi: false,
    auditTrail: false,
    accessLogging: false,
  },
};

export function getComplianceConfig(): ComplianceConfig {
  // In production, this would load from database or environment
  return {
    ...DEFAULT_COMPLIANCE_CONFIG,
    gdpr: {
      ...DEFAULT_COMPLIANCE_CONFIG.gdpr,
      enabled: process.env.COMPLIANCE_GDPR_ENABLED !== "false",
    },
    ccpa: {
      ...DEFAULT_COMPLIANCE_CONFIG.ccpa,
      enabled: process.env.COMPLIANCE_CCPA_ENABLED !== "false",
    },
    soc2: {
      ...DEFAULT_COMPLIANCE_CONFIG.soc2,
      enabled: process.env.COMPLIANCE_SOC2_ENABLED !== "false",
    },
    hipaa: {
      ...DEFAULT_COMPLIANCE_CONFIG.hipaa,
      enabled: process.env.COMPLIANCE_HIPAA_ENABLED === "true",
    },
  };
}

export function isGdprEnabled(): boolean {
  return getComplianceConfig().gdpr.enabled;
}

export function isCcpaEnabled(): boolean {
  return getComplianceConfig().ccpa.enabled;
}

export function isSoc2Enabled(): boolean {
  return getComplianceConfig().soc2.enabled;
}

export function isHipaaEnabled(): boolean {
  return getComplianceConfig().hipaa.enabled;
}

export function getDataRetentionDays(): number {
  return getComplianceConfig().gdpr.dataRetentionDays;
}
