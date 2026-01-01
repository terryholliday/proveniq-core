"""PROVENIQ Core - Valuation API Routes"""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException

from app.services.valuation import (
    ValuationEngine,
    ValuationRequest,
    ValuationResult,
)
from app.services.ledger import LedgerClient
from app.auth import AuthenticatedUser, get_current_user

router = APIRouter(prefix="/v1/valuations", tags=["valuations"])

# Service instances (in production, use dependency injection)
ledger_client = LedgerClient()
valuation_engine = ValuationEngine(ledger_client=ledger_client)


@router.post("", response_model=ValuationResult)
async def create_valuation(
    request: ValuationRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Generate a valuation for an asset.
    
    This is the central valuation endpoint used by all PROVENIQ apps.
    Returns estimated value with confidence score and bias flags.
    """
    try:
        result = await valuation_engine.value_asset(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{valuation_id}", response_model=ValuationResult)
async def get_valuation(
    valuation_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Get a previously computed valuation by ID.
    
    Note: In production, this would query from database.
    Currently returns 404 as we don't persist valuations.
    """
    raise HTTPException(status_code=404, detail="Valuation not found")
