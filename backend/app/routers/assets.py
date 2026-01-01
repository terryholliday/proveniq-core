"""PROVENIQ Core - Asset Registry API Routes"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.services.asset_registry import (
    AssetRegistry,
    AssetRegistration,
    RegisteredAsset,
)
from app.services.ledger import LedgerClient
from app.auth import AuthenticatedUser, get_current_user

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
async def register_asset(
    registration: AssetRegistration,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Register an asset and get a PROVENIQ Asset ID (PAID).
    
    If asset already registered from same source, returns existing record.
    """
    try:
        if registration.owner_type == "individual":
            if registration.owner_id and registration.owner_id != current_user.uid:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
            if not registration.owner_id:
                registration.owner_id = current_user.uid
        result = await asset_registry.register(registration)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{paid}", response_model=RegisteredAsset)
async def get_asset(
    paid: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get an asset by PROVENIQ Asset ID."""
    asset = await asset_registry.get(paid)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if asset.owner_id and asset.owner_id != current_user.uid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return asset


@router.get("", response_model=list[RegisteredAsset])
async def list_assets(
    owner_id: Optional[str] = Query(None, description="Filter by owner ID"),
    source_app: Optional[str] = Query(None, description="Filter by source app"),
    source_id: Optional[str] = Query(None, description="Source asset ID (requires source_app)"),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    List assets with optional filters.
    """
    if source_app and source_id:
        asset = await asset_registry.get_by_source(source_app, source_id)
        if asset and asset.owner_id and asset.owner_id != current_user.uid:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return [asset] if asset else []
    
    if owner_id and owner_id != current_user.uid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    if owner_id:
        return await asset_registry.list_by_owner(owner_id)
    
    return await asset_registry.list_by_owner(current_user.uid)


@router.post("/{paid}/anchor", response_model=RegisteredAsset)
async def bind_anchor(
    paid: UUID,
    request: BindAnchorRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Bind an anchor to an asset."""
    asset = await asset_registry.bind_anchor(paid, request.anchor_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if asset.owner_id and asset.owner_id != current_user.uid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return asset


@router.post("/{paid}/transfer", response_model=RegisteredAsset)
async def transfer_asset(
    paid: UUID,
    request: TransferRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Transfer asset ownership."""
    asset = await asset_registry.get(paid)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if asset.owner_id and asset.owner_id != current_user.uid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    asset = await asset_registry.transfer(
        paid, 
        request.new_owner_id, 
        request.new_owner_type
    )
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.patch("/{paid}/valuation", response_model=RegisteredAsset)
async def update_valuation(
    paid: UUID,
    request: UpdateValuationRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Update the current valuation for an asset."""
    asset = await asset_registry.get(paid)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if asset.owner_id and asset.owner_id != current_user.uid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    asset = await asset_registry.update_valuation(
        paid,
        request.value_micros,
        request.valuation_id
    )
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset
