"""PROVENIQ Core - Fraud Scoring Service

Provides fraud risk scoring for claims, transactions, and users.
Used by ClaimsIQ, Protect, Bids, and Capital for risk assessment.
"""

import hashlib
import json
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, Field


class FraudRiskLevel(str, Enum):
    LOW = "low"           # 0-30 score
    MEDIUM = "medium"     # 31-60 score
    HIGH = "high"         # 61-80 score
    CRITICAL = "critical" # 81-100 score


class FraudSignalType(str, Enum):
    VELOCITY = "velocity"           # Too many claims/transactions
    AMOUNT = "amount"               # Unusual amounts
    TIMING = "timing"               # Suspicious timing
    HISTORY = "history"             # Past fraud indicators
    IDENTITY = "identity"           # Identity verification issues
    DOCUMENTATION = "documentation" # Missing/inconsistent docs
    NETWORK = "network"             # Connected to known fraudsters
    BEHAVIORAL = "behavioral"       # Unusual behavior patterns


class FraudSignal(BaseModel):
    signal_type: FraudSignalType
    severity: int  # 1-10
    description: str
    evidence: dict = Field(default_factory=dict)


class FraudScoreRequest(BaseModel):
    entity_type: str  # "claim", "transaction", "user", "asset"
    entity_id: UUID
    user_id: Optional[UUID] = None
    asset_id: Optional[UUID] = None
    amount_micros: Optional[str] = None
    
    # Context
    source_app: str
    event_type: str  # What triggered the scoring
    
    # Historical data
    user_claim_count_30d: int = 0
    user_claim_total_micros_30d: str = "0"
    asset_claim_count_all: int = 0
    
    # Documentation
    evidence_count: int = 0
    has_anchor_verification: bool = False
    has_ledger_history: bool = False
    
    # Additional signals
    additional_signals: list[dict] = Field(default_factory=list)
    correlation_id: Optional[str] = None


class FraudScoreResult(BaseModel):
    score_id: UUID
    entity_type: str
    entity_id: UUID
    
    # Score (0-100, higher = more risky)
    score: int
    risk_level: FraudRiskLevel
    
    # Signals that contributed
    signals: list[FraudSignal]
    
    # Recommendation
    recommendation: str  # "approve", "review", "deny", "escalate"
    auto_decision_allowed: bool  # Can this be auto-decided?
    
    # Provenance
    inputs_hash: str
    scoring_version: str
    scored_at: datetime


class FraudScorer:
    """
    Central fraud scoring service for PROVENIQ ecosystem.
    
    All fraud-sensitive operations route through Core for consistent
    scoring and pattern detection across apps.
    """
    
    VERSION = "1.0.0"
    
    # Thresholds
    VELOCITY_CLAIM_THRESHOLD_30D = 3  # >3 claims in 30 days is suspicious
    VELOCITY_AMOUNT_THRESHOLD_30D = 50_000_000_000  # >$50k in 30 days
    ASSET_CLAIM_THRESHOLD = 2  # >2 claims on same asset
    
    def __init__(self, ledger_client=None):
        self.ledger_client = ledger_client
    
    def _compute_inputs_hash(self, request: FraudScoreRequest) -> str:
        """Compute SHA-256 of scoring inputs."""
        canonical = json.dumps({
            "entity_type": request.entity_type,
            "entity_id": str(request.entity_id),
            "user_id": str(request.user_id) if request.user_id else None,
            "asset_id": str(request.asset_id) if request.asset_id else None,
            "amount_micros": request.amount_micros,
            "source_app": request.source_app,
        }, sort_keys=True)
        return hashlib.sha256(canonical.encode()).hexdigest()
    
    def _check_velocity_signals(self, request: FraudScoreRequest) -> list[FraudSignal]:
        """Check for velocity-based fraud signals."""
        signals = []
        
        # Claim velocity
        if request.user_claim_count_30d > self.VELOCITY_CLAIM_THRESHOLD_30D:
            signals.append(FraudSignal(
                signal_type=FraudSignalType.VELOCITY,
                severity=min(10, 5 + request.user_claim_count_30d - self.VELOCITY_CLAIM_THRESHOLD_30D),
                description=f"User has {request.user_claim_count_30d} claims in last 30 days",
                evidence={"claim_count_30d": request.user_claim_count_30d},
            ))
        
        # Amount velocity
        total_30d = int(request.user_claim_total_micros_30d)
        if total_30d > self.VELOCITY_AMOUNT_THRESHOLD_30D:
            severity = min(10, 5 + int((total_30d - self.VELOCITY_AMOUNT_THRESHOLD_30D) / 10_000_000_000))
            signals.append(FraudSignal(
                signal_type=FraudSignalType.VELOCITY,
                severity=severity,
                description=f"User claimed ${total_30d / 1_000_000:.2f} in last 30 days",
                evidence={"total_micros_30d": request.user_claim_total_micros_30d},
            ))
        
        # Asset claim velocity
        if request.asset_claim_count_all > self.ASSET_CLAIM_THRESHOLD:
            signals.append(FraudSignal(
                signal_type=FraudSignalType.VELOCITY,
                severity=min(10, 6 + request.asset_claim_count_all - self.ASSET_CLAIM_THRESHOLD),
                description=f"Asset has {request.asset_claim_count_all} claims total",
                evidence={"asset_claim_count": request.asset_claim_count_all},
            ))
        
        return signals
    
    def _check_documentation_signals(self, request: FraudScoreRequest) -> list[FraudSignal]:
        """Check for documentation-based fraud signals."""
        signals = []
        
        # Low evidence count
        if request.evidence_count == 0:
            signals.append(FraudSignal(
                signal_type=FraudSignalType.DOCUMENTATION,
                severity=7,
                description="No evidence provided",
                evidence={"evidence_count": 0},
            ))
        elif request.evidence_count < 3:
            signals.append(FraudSignal(
                signal_type=FraudSignalType.DOCUMENTATION,
                severity=3,
                description="Limited evidence provided",
                evidence={"evidence_count": request.evidence_count},
            ))
        
        # No anchor verification
        if not request.has_anchor_verification:
            signals.append(FraudSignal(
                signal_type=FraudSignalType.DOCUMENTATION,
                severity=2,
                description="No anchor verification",
                evidence={"has_anchor": False},
            ))
        
        # No ledger history
        if not request.has_ledger_history:
            signals.append(FraudSignal(
                signal_type=FraudSignalType.DOCUMENTATION,
                severity=3,
                description="No provenance history in Ledger",
                evidence={"has_ledger_history": False},
            ))
        
        return signals
    
    def _check_amount_signals(self, request: FraudScoreRequest) -> list[FraudSignal]:
        """Check for amount-based fraud signals."""
        signals = []
        
        if request.amount_micros:
            amount = int(request.amount_micros)
            
            # Very high amount (>$10k)
            if amount > 10_000_000_000:
                signals.append(FraudSignal(
                    signal_type=FraudSignalType.AMOUNT,
                    severity=5,
                    description=f"High value claim: ${amount / 1_000_000:.2f}",
                    evidence={"amount_micros": request.amount_micros},
                ))
            
            # Suspiciously round numbers (exact thousands)
            if amount % 1_000_000_000 == 0 and amount >= 1_000_000_000:
                signals.append(FraudSignal(
                    signal_type=FraudSignalType.AMOUNT,
                    severity=2,
                    description="Suspiciously round claim amount",
                    evidence={"amount_micros": request.amount_micros},
                ))
        
        return signals
    
    def _calculate_score(self, signals: list[FraudSignal]) -> int:
        """Calculate overall fraud score from signals."""
        if not signals:
            return 0
        
        # Weighted sum with diminishing returns
        total_severity = sum(s.severity for s in signals)
        signal_count = len(signals)
        
        # Base score from severity
        base_score = min(100, total_severity * 5)
        
        # Bonus for multiple signals (compounds risk)
        compound_bonus = min(20, signal_count * 3)
        
        # Final score
        score = min(100, base_score + compound_bonus)
        
        return score
    
    def _get_risk_level(self, score: int) -> FraudRiskLevel:
        """Determine risk level from score."""
        if score <= 30:
            return FraudRiskLevel.LOW
        elif score <= 60:
            return FraudRiskLevel.MEDIUM
        elif score <= 80:
            return FraudRiskLevel.HIGH
        else:
            return FraudRiskLevel.CRITICAL
    
    def _get_recommendation(self, score: int, risk_level: FraudRiskLevel) -> tuple[str, bool]:
        """Determine recommendation and auto-decision flag."""
        if risk_level == FraudRiskLevel.LOW:
            return "approve", True
        elif risk_level == FraudRiskLevel.MEDIUM:
            return "review", False
        elif risk_level == FraudRiskLevel.HIGH:
            return "escalate", False
        else:  # CRITICAL
            return "deny", False
    
    async def score(self, request: FraudScoreRequest) -> FraudScoreResult:
        """
        Generate a fraud score for an entity.
        
        This is the primary scoring endpoint used by all PROVENIQ apps.
        """
        score_id = uuid4()
        signals = []
        
        # Collect signals from all checks
        signals.extend(self._check_velocity_signals(request))
        signals.extend(self._check_documentation_signals(request))
        signals.extend(self._check_amount_signals(request))
        
        # Process any additional custom signals
        for custom in request.additional_signals:
            if "signal_type" in custom and "severity" in custom:
                signals.append(FraudSignal(
                    signal_type=FraudSignalType(custom.get("signal_type", "behavioral")),
                    severity=custom["severity"],
                    description=custom.get("description", "Custom signal"),
                    evidence=custom.get("evidence", {}),
                ))
        
        # Calculate score
        score = self._calculate_score(signals)
        risk_level = self._get_risk_level(score)
        recommendation, auto_decision = self._get_recommendation(score, risk_level)
        
        # Compute inputs hash
        inputs_hash = self._compute_inputs_hash(request)
        
        result = FraudScoreResult(
            score_id=score_id,
            entity_type=request.entity_type,
            entity_id=request.entity_id,
            score=score,
            risk_level=risk_level,
            signals=signals,
            recommendation=recommendation,
            auto_decision_allowed=auto_decision,
            inputs_hash=inputs_hash,
            scoring_version=self.VERSION,
            scored_at=datetime.utcnow(),
        )
        
        # Write to Ledger if available
        if self.ledger_client:
            await self.ledger_client.write_event(
                source="core",
                event_type="FRAUD_SCORE_COMPUTED",
                payload={
                    "score_id": str(score_id),
                    "entity_type": request.entity_type,
                    "entity_id": str(request.entity_id),
                    "score": score,
                    "risk_level": risk_level.value,
                    "recommendation": recommendation,
                    "signal_count": len(signals),
                    "inputs_hash": inputs_hash,
                },
                correlation_id=request.correlation_id,
            )
        
        return result
