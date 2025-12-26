/**
 * @file services/anomaly/detector.ts
 * @description PROVENIQ Core Anomaly Detection Engine
 * 
 * Detects unusual patterns:
 * - Velocity spikes (sudden activity bursts)
 * - Amount anomalies (unusual values)
 * - Timing patterns (off-hours activity)
 * - Geographic anomalies (impossible travel)
 * - Behavioral drift (change from baseline)
 */

import { z } from 'zod';

// ============================================
// TYPES
// ============================================

export const AnomalyDetectionRequestSchema = z.object({
  entityType: z.enum(['user', 'asset', 'provider', 'location']),
  entityId: z.string(),
  
  // Current event
  eventType: z.string(),
  eventValue: z.number().optional(),
  eventTimestamp: z.string().datetime().optional(),
  
  // Historical context
  recentEvents: z.array(z.object({
    eventType: z.string(),
    eventValue: z.number().optional(),
    timestamp: z.string(),
  })).optional(),
  
  // Baseline (if known)
  baselineAvgValue: z.number().optional(),
  baselineAvgFrequency: z.number().optional(), // events per day
  baselineActiveHours: z.array(z.number().min(0).max(23)).optional(),
  
  // Location context
  currentLocation: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  lastKnownLocation: z.object({
    lat: z.number(),
    lng: z.number(),
    timestamp: z.string(),
  }).optional(),
});

export type AnomalyDetectionRequest = z.infer<typeof AnomalyDetectionRequestSchema>;

export interface Anomaly {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  description: string;
  details: Record<string, any>;
}

export interface AnomalyDetectionResult {
  detectionId: string;
  entityType: string;
  entityId: string;
  
  // Detection results
  anomalyDetected: boolean;
  anomalyScore: number; // 0-100
  anomalies: Anomaly[];
  
  // Risk assessment
  riskLevel: 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  recommendedAction: 'ALLOW' | 'FLAG' | 'REVIEW' | 'BLOCK';
  
  // Metadata
  detectedAt: string;
  modelVersion: string;
}

// ============================================
// ANOMALY THRESHOLDS
// ============================================

const VELOCITY_THRESHOLDS = {
  user: { warningMultiplier: 3, criticalMultiplier: 5 },
  asset: { warningMultiplier: 2, criticalMultiplier: 4 },
  provider: { warningMultiplier: 4, criticalMultiplier: 8 },
  location: { warningMultiplier: 3, criticalMultiplier: 6 },
};

const AMOUNT_THRESHOLDS = {
  warningDeviation: 2, // Standard deviations
  criticalDeviation: 3,
};

const TIME_THRESHOLDS = {
  offHoursStart: 23, // 11 PM
  offHoursEnd: 6,    // 6 AM
};

const GEO_THRESHOLDS = {
  impossibleSpeedKmh: 1000, // Faster than commercial flight
  suspiciousSpeedKmh: 500,
};

// ============================================
// ANOMALY DETECTOR
// ============================================

export class AnomalyDetector {
  private modelVersion = '1.0.0';

  /**
   * Detect anomalies in activity patterns
   */
  async detect(request: AnomalyDetectionRequest): Promise<AnomalyDetectionResult> {
    const validated = AnomalyDetectionRequestSchema.parse(request);
    const detectionId = `ANOM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const anomalies: Anomaly[] = [];

    // Run all detection algorithms
    const velocityAnomaly = this.detectVelocitySpike(validated);
    if (velocityAnomaly) anomalies.push(velocityAnomaly);

    const amountAnomaly = this.detectAmountAnomaly(validated);
    if (amountAnomaly) anomalies.push(amountAnomaly);

    const timingAnomaly = this.detectTimingAnomaly(validated);
    if (timingAnomaly) anomalies.push(timingAnomaly);

    const geoAnomaly = this.detectGeoAnomaly(validated);
    if (geoAnomaly) anomalies.push(geoAnomaly);

    const behaviorAnomaly = this.detectBehaviorDrift(validated);
    if (behaviorAnomaly) anomalies.push(behaviorAnomaly);

    // Calculate overall anomaly score
    const anomalyScore = this.calculateAnomalyScore(anomalies);
    const riskLevel = this.getRiskLevel(anomalyScore, anomalies);
    const recommendedAction = this.getRecommendedAction(riskLevel, anomalies);

    return {
      detectionId,
      entityType: validated.entityType,
      entityId: validated.entityId,
      anomalyDetected: anomalies.length > 0,
      anomalyScore,
      anomalies,
      riskLevel,
      recommendedAction,
      detectedAt: now,
      modelVersion: this.modelVersion,
    };
  }

  /**
   * Detect velocity spikes (unusual activity frequency)
   */
  private detectVelocitySpike(request: AnomalyDetectionRequest): Anomaly | null {
    const recentEvents = request.recentEvents || [];
    const baseline = request.baselineAvgFrequency || 5; // Default 5 events/day
    
    // Count events in last hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentCount = recentEvents.filter(e => 
      new Date(e.timestamp).getTime() > oneHourAgo
    ).length + 1; // +1 for current event
    
    // Expected hourly rate
    const expectedHourly = baseline / 24;
    const thresholds = VELOCITY_THRESHOLDS[request.entityType];
    
    if (recentCount > expectedHourly * thresholds.criticalMultiplier) {
      return {
        type: 'VELOCITY_SPIKE',
        severity: 'critical',
        confidence: 90,
        description: `Activity rate ${Math.round(recentCount / expectedHourly)}x above baseline`,
        details: {
          recentCount,
          expectedHourly: Math.round(expectedHourly * 100) / 100,
          multiplier: Math.round(recentCount / expectedHourly * 10) / 10,
        },
      };
    }
    
    if (recentCount > expectedHourly * thresholds.warningMultiplier) {
      return {
        type: 'VELOCITY_SPIKE',
        severity: 'medium',
        confidence: 75,
        description: `Elevated activity rate detected`,
        details: {
          recentCount,
          expectedHourly: Math.round(expectedHourly * 100) / 100,
          multiplier: Math.round(recentCount / expectedHourly * 10) / 10,
        },
      };
    }
    
    return null;
  }

  /**
   * Detect amount anomalies (unusual values)
   */
  private detectAmountAnomaly(request: AnomalyDetectionRequest): Anomaly | null {
    if (request.eventValue === undefined || request.baselineAvgValue === undefined) {
      return null;
    }
    
    const recentEvents = request.recentEvents || [];
    const values = recentEvents
      .filter(e => e.eventValue !== undefined)
      .map(e => e.eventValue as number);
    
    if (values.length < 3) return null; // Need history for comparison
    
    // Calculate standard deviation
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance) || mean * 0.2; // Fallback to 20% of mean
    
    const deviation = Math.abs(request.eventValue - mean) / stdDev;
    
    if (deviation > AMOUNT_THRESHOLDS.criticalDeviation) {
      return {
        type: 'AMOUNT_ANOMALY',
        severity: 'high',
        confidence: 85,
        description: `Value ${request.eventValue} is ${deviation.toFixed(1)} std devs from mean`,
        details: {
          currentValue: request.eventValue,
          mean: Math.round(mean),
          stdDev: Math.round(stdDev),
          deviation: Math.round(deviation * 10) / 10,
        },
      };
    }
    
    if (deviation > AMOUNT_THRESHOLDS.warningDeviation) {
      return {
        type: 'AMOUNT_ANOMALY',
        severity: 'medium',
        confidence: 70,
        description: `Value deviates significantly from baseline`,
        details: {
          currentValue: request.eventValue,
          mean: Math.round(mean),
          deviation: Math.round(deviation * 10) / 10,
        },
      };
    }
    
    return null;
  }

  /**
   * Detect timing anomalies (off-hours activity)
   */
  private detectTimingAnomaly(request: AnomalyDetectionRequest): Anomaly | null {
    const timestamp = request.eventTimestamp ? new Date(request.eventTimestamp) : new Date();
    const hour = timestamp.getUTCHours();
    
    // Check if activity is during off-hours
    const isOffHours = hour >= TIME_THRESHOLDS.offHoursStart || hour < TIME_THRESHOLDS.offHoursEnd;
    
    if (!isOffHours) return null;
    
    // Check if off-hours activity is normal for this entity
    const baselineHours = request.baselineActiveHours || [9, 10, 11, 12, 13, 14, 15, 16, 17]; // Business hours
    const isExpected = baselineHours.includes(hour);
    
    if (isExpected) return null;
    
    return {
      type: 'TIMING_ANOMALY',
      severity: 'low',
      confidence: 60,
      description: `Activity at unusual time (${hour}:00 UTC)`,
      details: {
        eventHour: hour,
        isOffHours: true,
        baselineHours,
      },
    };
  }

  /**
   * Detect geographic anomalies (impossible travel)
   */
  private detectGeoAnomaly(request: AnomalyDetectionRequest): Anomaly | null {
    if (!request.currentLocation || !request.lastKnownLocation) {
      return null;
    }
    
    const { lat: lat1, lng: lng1 } = request.lastKnownLocation;
    const { lat: lat2, lng: lng2 } = request.currentLocation;
    
    // Calculate distance (Haversine formula)
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Calculate time difference
    const timeDiffHours = (Date.now() - new Date(request.lastKnownLocation.timestamp).getTime()) / (1000 * 60 * 60);
    
    if (timeDiffHours <= 0) return null;
    
    const speedKmh = distance / timeDiffHours;
    
    if (speedKmh > GEO_THRESHOLDS.impossibleSpeedKmh) {
      return {
        type: 'GEO_ANOMALY',
        severity: 'critical',
        confidence: 95,
        description: `Impossible travel detected (${Math.round(distance)}km in ${timeDiffHours.toFixed(1)}h)`,
        details: {
          distance: Math.round(distance),
          timeDiffHours: Math.round(timeDiffHours * 10) / 10,
          impliedSpeedKmh: Math.round(speedKmh),
        },
      };
    }
    
    if (speedKmh > GEO_THRESHOLDS.suspiciousSpeedKmh) {
      return {
        type: 'GEO_ANOMALY',
        severity: 'high',
        confidence: 80,
        description: `Suspicious travel speed detected`,
        details: {
          distance: Math.round(distance),
          timeDiffHours: Math.round(timeDiffHours * 10) / 10,
          impliedSpeedKmh: Math.round(speedKmh),
        },
      };
    }
    
    return null;
  }

  /**
   * Detect behavioral drift (change from baseline patterns)
   */
  private detectBehaviorDrift(request: AnomalyDetectionRequest): Anomaly | null {
    const recentEvents = request.recentEvents || [];
    
    if (recentEvents.length < 10) return null; // Need sufficient history
    
    // Analyze event type distribution
    const eventTypeCounts: Record<string, number> = {};
    recentEvents.forEach(e => {
      eventTypeCounts[e.eventType] = (eventTypeCounts[e.eventType] || 0) + 1;
    });
    
    // Check if current event type is unusual
    const currentTypeCount = eventTypeCounts[request.eventType] || 0;
    const totalEvents = recentEvents.length;
    const currentTypeRatio = currentTypeCount / totalEvents;
    
    // If this event type is rare (<5% of history), flag it
    if (currentTypeRatio < 0.05 && totalEvents > 20) {
      return {
        type: 'BEHAVIOR_DRIFT',
        severity: 'low',
        confidence: 55,
        description: `Unusual event type for this entity`,
        details: {
          eventType: request.eventType,
          historicalRatio: Math.round(currentTypeRatio * 100),
          totalHistoricalEvents: totalEvents,
        },
      };
    }
    
    return null;
  }

  /**
   * Calculate overall anomaly score
   */
  private calculateAnomalyScore(anomalies: Anomaly[]): number {
    if (anomalies.length === 0) return 0;
    
    const severityWeights = { low: 15, medium: 35, high: 60, critical: 85 };
    
    let totalScore = 0;
    anomalies.forEach(a => {
      const baseScore = severityWeights[a.severity];
      const weightedScore = baseScore * (a.confidence / 100);
      totalScore += weightedScore;
    });
    
    return Math.min(100, Math.round(totalScore));
  }

  /**
   * Determine risk level from anomalies
   */
  private getRiskLevel(score: number, anomalies: Anomaly[]): 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL' {
    // Critical anomaly automatically elevates risk
    if (anomalies.some(a => a.severity === 'critical')) return 'CRITICAL';
    
    if (score >= 70) return 'CRITICAL';
    if (score >= 45) return 'HIGH';
    if (score >= 20) return 'ELEVATED';
    return 'NORMAL';
  }

  /**
   * Get recommended action based on risk
   */
  private getRecommendedAction(
    riskLevel: string, 
    anomalies: Anomaly[]
  ): 'ALLOW' | 'FLAG' | 'REVIEW' | 'BLOCK' {
    // Geo anomaly with critical severity = block
    if (anomalies.some(a => a.type === 'GEO_ANOMALY' && a.severity === 'critical')) {
      return 'BLOCK';
    }
    
    if (riskLevel === 'CRITICAL') return 'BLOCK';
    if (riskLevel === 'HIGH') return 'REVIEW';
    if (riskLevel === 'ELEVATED') return 'FLAG';
    return 'ALLOW';
  }
}

// Singleton
let detector: AnomalyDetector | null = null;

export function getAnomalyDetector(): AnomalyDetector {
  if (!detector) {
    detector = new AnomalyDetector();
  }
  return detector;
}
