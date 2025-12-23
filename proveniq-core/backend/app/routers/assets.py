"""PROVENIQ Core - Asset Registry API Routes"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.services.asset_registry import (
    AssetRegistry,
    AssetRegistration,
    RegisteredAsset,
)
from app.services.ledger import LedgerClient

router = APIRouter(prefix="/v1/assets", tags=["assets"])

# Service instances
ledger_client = LedgerClient()
asset_registry = AssetRegistry(ledger_client=ledger_client)


class BindAnchorRequest(BaseModel):
    anchor_id: str


class TransferRequest(BaseModel):
    new_owner_id: str
    new_owner_type: str = "individual"


class UpdateValuationRequest(BaseModel):
    value_micros: str
    valuation_id: UUID


@router.post("", response_model=RegisteredAsset, status_code=201)
async def register_asset(registration: AssetRegistration):
    """
    Register an asset and get a PROVENIQ Asset ID (PAID).
    
    If asset already registered from same source, returns existing record.
    """
    try:
        result = await asset_registry.register(registration)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{paid}", response_model=RegisteredAsset)
async def get_asset(paid: UUID):
    """Get an asset by PROVENIQ Asset ID."""
    asset = await asset_registry.get(paid)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.get("", response_model=list[RegisteredAsset])
async def list_assets(
    owner_id: Optional[str] = Query(None, description="Filter by owner ID"),
    source_app: Optional[str] = Query(None, description="Filter by source app"),
    source_id: Optional[str] = Query(None, description="Source asset ID (requires source_app)"),
):
    """
    List assets with optional filters.
    """
    if source_app and source_id:
        asset = await asset_registry.get_by_source(source_app, source_id)
        return [asset] if asset else []
    
    if owner_id:
        return await asset_registry.list_by_owner(owner_id)
    
    # Return all (limited for demo)
    return list(asset_registry._assets.values())[:100]


@router.post("/{paid}/anchor", response_model=RegisteredAsset)
async def bind_anchor(paid: UUID, request: BindAnchorRequest):
    """Bind an anchor to an asset."""
    asset = await asset_registry.bind_anchor(paid, request.anchor_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.post("/{paid}/transfer", response_model=RegisteredAsset)
async def transfer_asset(paid: UUID, request: TransferRequest):
    """Transfer asset ownership."""
    asset = await asset_registry.transfer(
        paid, 
        request.new_owner_id, 
        request.new_owner_type
    )
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.patch("/{paid}/valuation", response_model=RegisteredAsset)
async def update_valuation(paid: UUID, request: UpdateValuationRequest):
    """Update the current valuation for an asset."""
    asset = await asset_registry.update_valuation(
        paid,
        request.value_micros,
        request.valuation_id
    )
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset
