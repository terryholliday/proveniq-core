"""PROVENIQ Core - Valuation Engine

Provides algorithmic asset valuation with bias monitoring and confidence scoring.
This is the single source of truth for asset values across the ecosystem.
"""

import hashlib
import json
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, Field


class ValuationMethod(str, Enum):
    AI_VISION = "ai_vision"
    MARKET_COMP = "market_comp"
    MANUAL = "manual"
    HYBRID = "hybrid"


class ConfidenceLevel(str, Enum):
    HIGH = "high"      # >85% confidence
    MEDIUM = "medium"  # 60-85% confidence
    LOW = "low"        # <60% confidence


class ValuationRequest(BaseModel):
    asset_id: UUID
    item_type: str  # e.g., "electronics", "furniture", "jewelry"
    brand: Optional[str] = None
    model: Optional[str] = None
    condition: str  # "new", "like_new", "good", "fair", "poor"
    age_years: Optional[float] = None
    purchase_price_micros: Optional[str] = None  # Original price if known
    images: list[str] = Field(default_factory=list)  # Evidence URLs
    ai_detected_attributes: dict = Field(default_factory=dict)
    source_app: str  # home, properties, ops, etc.
    correlation_id: Optional[str] = None


class ValuationResult(BaseModel):
    valuation_id: UUID
    asset_id: UUID
    
    # Values (all in micros = millionths of currency)
    estimated_value_micros: str
    low_estimate_micros: str
    high_estimate_micros: str
    currency: str = "USD"
    
    # Confidence
    confidence_score: float  # 0.0 - 1.0
    confidence_level: ConfidenceLevel
    
    # Method and factors
    method: ValuationMethod
    factors: list[dict]  # Factors that influenced the valuation
    
    # Bias monitoring
    bias_flags: list[str]  # Any detected bias concerns
    
    # Provenance
    inputs_hash: str  # SHA-256 of canonical inputs
    valuation_version: str
    valued_at: datetime


class ValuationEngine:
    """
    Central valuation engine for PROVENIQ ecosystem.
    
    All apps call Core for valuations - this ensures consistency
    and enables bias monitoring across the platform.
    """
    
    VERSION = "1.0.0"
    
    # Depreciation rates by category (annual %)
    DEPRECIATION_RATES = {
        "electronics": 0.25,
        "furniture": 0.10,
        "appliances": 0.12,
        "jewelry": 0.02,
        "collectibles": -0.05,  # Can appreciate
        "clothing": 0.30,
        "tools": 0.15,
        "default": 0.15,
    }
    
    # Condition multipliers
    CONDITION_MULTIPLIERS = {
        "new": 1.0,
        "like_new": 0.85,
        "good": 0.70,
        "fair": 0.50,
        "poor": 0.25,
    }
    
    def __init__(self, ledger_client=None):
        self.ledger_client = ledger_client
    
    def _compute_inputs_hash(self, request: ValuationRequest) -> str:
        """Compute SHA-256 of canonical inputs for provenance."""
        canonical = json.dumps({
            "asset_id": str(request.asset_id),
            "item_type": request.item_type,
            "brand": request.brand,
            "model": request.model,
            "condition": request.condition,
            "age_years": request.age_years,
            "purchase_price_micros": request.purchase_price_micros,
        }, sort_keys=True)
        return hashlib.sha256(canonical.encode()).hexdigest()
    
    def _get_depreciation_rate(self, item_type: str) -> float:
        """Get annual depreciation rate for item type."""
        return self.DEPRECIATION_RATES.get(
            item_type.lower(), 
            self.DEPRECIATION_RATES["default"]
        )
    
    def _apply_depreciation(self, value_micros: int, age_years: float, rate: float) -> int:
        """Apply depreciation based on age and rate."""
        if age_years is None or age_years <= 0:
            return value_micros
        
        # Declining balance depreciation
        remaining_value = value_micros * ((1 - rate) ** age_years)
        
        # Floor at 10% of original value
        return max(int(remaining_value), int(value_micros * 0.1))
    
    def _detect_bias(self, request: ValuationRequest, estimated_value: int) -> list[str]:
        """Detect potential bias in valuation inputs or outputs."""
        flags = []
        
        # Check for suspiciously high values relative to category averages
        # (In production, this would use historical data)
        if request.purchase_price_micros:
            purchase = int(request.purchase_price_micros)
            if estimated_value > purchase * 1.5:
                flags.append("ESTIMATED_EXCEEDS_PURCHASE_150PCT")
        
        # Check for missing key attributes
        if not request.brand and request.item_type in ["electronics", "appliances"]:
            flags.append("MISSING_BRAND_FOR_CATEGORY")
        
        # Check for condition inconsistency with age
        if request.age_years and request.age_years > 10 and request.condition == "new":
            flags.append("AGE_CONDITION_MISMATCH")
        
        return flags
    
    def _calculate_confidence(self, request: ValuationRequest, bias_flags: list[str]) -> tuple[float, ConfidenceLevel]:
        """Calculate confidence score based on input quality."""
        score = 1.0
        
        # Deduct for missing information
        if not request.brand:
            score -= 0.15
        if not request.model:
            score -= 0.10
        if request.age_years is None:
            score -= 0.10
        if not request.purchase_price_micros:
            score -= 0.15
        if len(request.images) == 0:
            score -= 0.20
        
        # Deduct for bias flags
        score -= len(bias_flags) * 0.10
        
        # Floor at 0.1
        score = max(score, 0.1)
        
        # Determine level
        if score >= 0.85:
            level = ConfidenceLevel.HIGH
        elif score >= 0.60:
            level = ConfidenceLevel.MEDIUM
        else:
            level = ConfidenceLevel.LOW
        
        return score, level
    
    async def value_asset(self, request: ValuationRequest) -> ValuationResult:
        """
        Generate a valuation for an asset.
        
        This is the primary valuation endpoint used by all PROVENIQ apps.
        """
        valuation_id = uuid4()
        factors = []
        
        # Determine base value
        base_value_micros = None
        method = ValuationMethod.HYBRID
        
        # If we have purchase price, use it as reference
        if request.purchase_price_micros:
            base_value_micros = int(request.purchase_price_micros)
            factors.append({
                "factor": "purchase_price",
                "impact": "base",
                "value_micros": str(base_value_micros),
            })
            method = ValuationMethod.MARKET_COMP
        else:
            # Use AI-detected attributes or category averages
            # In production, this would call market data APIs
            base_value_micros = self._estimate_from_category(request)
            factors.append({
                "factor": "category_estimate",
                "impact": "base",
                "value_micros": str(base_value_micros),
            })
            method = ValuationMethod.AI_VISION if request.ai_detected_attributes else ValuationMethod.MANUAL
        
        # Apply depreciation
        depreciation_rate = self._get_depreciation_rate(request.item_type)
        depreciated_value = self._apply_depreciation(
            base_value_micros, 
            request.age_years or 0, 
            depreciation_rate
        )
        
        if depreciated_value != base_value_micros:
            factors.append({
                "factor": "depreciation",
                "impact": "reduction",
                "rate": depreciation_rate,
                "age_years": request.age_years,
                "value_micros": str(depreciated_value),
            })
        
        # Apply condition multiplier
        condition_mult = self.CONDITION_MULTIPLIERS.get(
            request.condition.lower(), 
            self.CONDITION_MULTIPLIERS["good"]
        )
        conditioned_value = int(depreciated_value * condition_mult)
        
        if condition_mult != 1.0:
            factors.append({
                "factor": "condition",
                "impact": "adjustment",
                "multiplier": condition_mult,
                "condition": request.condition,
                "value_micros": str(conditioned_value),
            })
        
        estimated_value_micros = conditioned_value
        
        # Calculate range (±20% for medium confidence)
        low_estimate = int(estimated_value_micros * 0.80)
        high_estimate = int(estimated_value_micros * 1.20)
        
        # Detect bias
        bias_flags = self._detect_bias(request, estimated_value_micros)
        
        # Calculate confidence
        confidence_score, confidence_level = self._calculate_confidence(request, bias_flags)
        
        # Adjust range based on confidence
        if confidence_level == ConfidenceLevel.LOW:
            low_estimate = int(estimated_value_micros * 0.60)
            high_estimate = int(estimated_value_micros * 1.40)
        elif confidence_level == ConfidenceLevel.HIGH:
            low_estimate = int(estimated_value_micros * 0.90)
            high_estimate = int(estimated_value_micros * 1.10)
        
        # Compute inputs hash
        inputs_hash = self._compute_inputs_hash(request)
        
        result = ValuationResult(
            valuation_id=valuation_id,
            asset_id=request.asset_id,
            estimated_value_micros=str(estimated_value_micros),
            low_estimate_micros=str(low_estimate),
            high_estimate_micros=str(high_estimate),
            currency="USD",
            confidence_score=confidence_score,
            confidence_level=confidence_level,
            method=method,
            factors=factors,
            bias_flags=bias_flags,
            inputs_hash=inputs_hash,
            valuation_version=self.VERSION,
            valued_at=datetime.utcnow(),
        )
        
        # Write to Ledger if available
        if self.ledger_client:
            await self.ledger_client.write_event(
                source="core",
                event_type="VALUATION_COMPUTED",
                asset_id=str(request.asset_id),
                payload={
                    "valuation_id": str(valuation_id),
                    "estimated_value_micros": str(estimated_value_micros),
                    "confidence_level": confidence_level.value,
                    "method": method.value,
                    "inputs_hash": inputs_hash,
                    "bias_flags": bias_flags,
                },
                correlation_id=request.correlation_id,
            )
        
        return result
    
    def _estimate_from_category(self, request: ValuationRequest) -> int:
        """
        Estimate value from category when no purchase price available.
        In production, this would use market data APIs.
        """
        # Very rough category-based estimates (in micros)
        category_estimates = {
            "electronics": 500_000_000,   # $500
            "furniture": 300_000_000,     # $300
            "appliances": 400_000_000,    # $400
            "jewelry": 1_000_000_000,     # $1000
            "collectibles": 200_000_000,  # $200
            "clothing": 50_000_000,       # $50
            "tools": 100_000_000,         # $100
            "default": 200_000_000,       # $200
        }
        
        base = category_estimates.get(
            request.item_type.lower(),
            category_estimates["default"]
        )
        
        # Adjust for brand if known (premium brands +50%)
        premium_brands = ["apple", "rolex", "herman miller", "dyson", "bose"]
        if request.brand and request.brand.lower() in premium_brands:
            base = int(base * 1.5)
        
        return base
