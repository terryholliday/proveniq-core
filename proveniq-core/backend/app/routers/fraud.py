"""PROVENIQ Core - Fraud Scoring API Routes"""

from uuid import UUID
from fastapi import APIRouter, HTTPException

from app.services.fraud import (
    FraudScorer,
    FraudScoreRequest,
    FraudScoreResult,
)
from app.services.ledger import LedgerClient

router = APIRouter(prefix="/v1/fraud", tags=["fraud"])

# Service instances
ledger_client = LedgerClient()
fraud_scorer = FraudScorer(ledger_client=ledger_client)


@router.post("/score", response_model=FraudScoreResult)
async def score_entity(request: FraudScoreRequest):
    """
    Generate a fraud score for an entity (claim, transaction, user).
    
    Returns score 0-100, risk level, signals detected, and recommendation.
    """
    try:
        result = await fraud_scorer.score(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/score/{score_id}", response_model=FraudScoreResult)
async def get_score(score_id: UUID):
    """
    Get a previously computed fraud score by ID.
    
    Note: In production, this would query from database.
    """
    raise HTTPException(status_code=404, detail="Score not found")
