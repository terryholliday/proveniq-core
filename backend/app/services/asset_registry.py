"""PROVENIQ Core - Asset Registry

Central registry for all assets across the PROVENIQ ecosystem.
Assets registered here get a canonical PROVENIQ Asset ID (PAID).
"""

import hashlib
import json
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, Field


class AssetStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    DISPUTED = "disputed"
    TRANSFERRED = "transferred"


class AssetSource(str, Enum):
    HOME = "home"
    PROPERTIES = "properties"
    OPS = "ops"
    ORIGINS = "origins"
    BIDS = "bids"
    TRANSIT = "transit"
    MANUAL = "manual"


class AssetRegistration(BaseModel):
    """Request to register an asset in Core."""
    source_app: AssetSource
    source_asset_id: str  # ID in the source app
    
    # Asset identity
    asset_type: str  # "item", "property", "vehicle", etc.
    category: str  # "electronics", "furniture", etc.
    name: str
    description: Optional[str] = None
    
    # Owner
    owner_id: Optional[str] = None  # Firebase UID or org ID
    owner_type: str = "individual"  # "individual", "organization"
    
    # Provenance
    images: list[str] = Field(default_factory=list)
    documents: list[str] = Field(default_factory=list)
    
    # Anchor binding
    anchor_id: Optional[str] = None
    
    # Valuation (if known)
    estimated_value_micros: Optional[str] = None
    currency: str = "USD"
    
    # Metadata
    metadata: dict = Field(default_factory=dict)
    correlation_id: Optional[str] = None


class RegisteredAsset(BaseModel):
    """A registered asset in the Core registry."""
    paid: UUID  # PROVENIQ Asset ID
    
    source_app: AssetSource
    source_asset_id: str
    
    asset_type: str
    category: str
    name: str
    description: Optional[str] = None
    
    owner_id: Optional[str] = None
    owner_type: str
    
    status: AssetStatus
    anchor_id: Optional[str] = None
    
    # Latest valuation
    current_value_micros: Optional[str] = None
    valuation_id: Optional[UUID] = None
    valued_at: Optional[datetime] = None
    
    # Provenance hash
    provenance_hash: str  # Hash of registration data
    
    registered_at: datetime
    updated_at: datetime


class AssetRegistry:
    """
    Central asset registry for PROVENIQ ecosystem.
    
    Every asset gets a PROVENIQ Asset ID (PAID) that serves as the
    canonical identifier across all apps and the Ledger.
    """
    
    def __init__(self, db_session=None, ledger_client=None):
        self.db = db_session
        self.ledger_client = ledger_client
        
        # In-memory cache for demo (replace with DB in production)
        self._assets: dict[UUID, RegisteredAsset] = {}
        self._source_index: dict[str, UUID] = {}  # source_app:source_id -> PAID
    
    def _compute_provenance_hash(self, registration: AssetRegistration) -> str:
        """Compute hash of registration data for provenance."""
        canonical = json.dumps({
            "source_app": registration.source_app.value,
            "source_asset_id": registration.source_asset_id,
            "asset_type": registration.asset_type,
            "category": registration.category,
            "name": registration.name,
            "owner_id": registration.owner_id,
            "anchor_id": registration.anchor_id,
        }, sort_keys=True)
        return hashlib.sha256(canonical.encode()).hexdigest()
    
    def _make_source_key(self, source_app: str, source_id: str) -> str:
        """Create lookup key for source index."""
        return f"{source_app}:{source_id}"
    
    async def register(self, registration: AssetRegistration) -> RegisteredAsset:
        """
        Register an asset and get a PROVENIQ Asset ID.
        
        If asset already registered from same source, returns existing record.
        """
        source_key = self._make_source_key(registration.source_app.value, registration.source_asset_id)
        
        # Check if already registered
        if source_key in self._source_index:
            existing_paid = self._source_index[source_key]
            return self._assets[existing_paid]
        
        # Create new registration
        paid = uuid4()
        now = datetime.utcnow()
        provenance_hash = self._compute_provenance_hash(registration)
        
        asset = RegisteredAsset(
            paid=paid,
            source_app=registration.source_app,
            source_asset_id=registration.source_asset_id,
            asset_type=registration.asset_type,
            category=registration.category,
            name=registration.name,
            description=registration.description,
            owner_id=registration.owner_id,
            owner_type=registration.owner_type,
            status=AssetStatus.ACTIVE,
            anchor_id=registration.anchor_id,
            current_value_micros=registration.estimated_value_micros,
            provenance_hash=provenance_hash,
            registered_at=now,
            updated_at=now,
        )
        
        # Store
        self._assets[paid] = asset
        self._source_index[source_key] = paid
        
        # Write to Ledger
        if self.ledger_client:
            await self.ledger_client.write_event(
                source="core",
                event_type="ASSET_REGISTERED",
                asset_id=str(paid),
                anchor_id=registration.anchor_id,
                payload={
                    "paid": str(paid),
                    "source_app": registration.source_app.value,
                    "source_asset_id": registration.source_asset_id,
                    "asset_type": registration.asset_type,
                    "category": registration.category,
                    "name": registration.name,
                    "owner_id": registration.owner_id,
                    "provenance_hash": provenance_hash,
                },
                correlation_id=registration.correlation_id,
            )
        
        return asset
    
    async def get(self, paid: UUID) -> Optional[RegisteredAsset]:
        """Get an asset by PROVENIQ Asset ID."""
        return self._assets.get(paid)
    
    async def get_by_source(self, source_app: str, source_id: str) -> Optional[RegisteredAsset]:
        """Get an asset by source app and ID."""
        source_key = self._make_source_key(source_app, source_id)
        paid = self._source_index.get(source_key)
        if paid:
            return self._assets.get(paid)
        return None
    
    async def update_valuation(
        self, 
        paid: UUID, 
        value_micros: str, 
        valuation_id: UUID
    ) -> Optional[RegisteredAsset]:
        """Update the current valuation for an asset."""
        asset = self._assets.get(paid)
        if not asset:
            return None
        
        # Update in place (Pydantic model mutation)
        asset_dict = asset.model_dump()
        asset_dict["current_value_micros"] = value_micros
        asset_dict["valuation_id"] = valuation_id
        asset_dict["valued_at"] = datetime.utcnow()
        asset_dict["updated_at"] = datetime.utcnow()
        
        updated = RegisteredAsset(**asset_dict)
        self._assets[paid] = updated
        
        return updated
    
    async def bind_anchor(self, paid: UUID, anchor_id: str) -> Optional[RegisteredAsset]:
        """Bind an anchor to an asset."""
        asset = self._assets.get(paid)
        if not asset:
            return None
        
        asset_dict = asset.model_dump()
        asset_dict["anchor_id"] = anchor_id
        asset_dict["updated_at"] = datetime.utcnow()
        
        updated = RegisteredAsset(**asset_dict)
        self._assets[paid] = updated
        
        # Write to Ledger
        if self.ledger_client:
            await self.ledger_client.write_event(
                source="core",
                event_type="ANCHOR_BOUND_TO_ASSET",
                asset_id=str(paid),
                anchor_id=anchor_id,
                payload={
                    "paid": str(paid),
                    "anchor_id": anchor_id,
                },
            )
        
        return updated
    
    async def transfer(
        self, 
        paid: UUID, 
        new_owner_id: str, 
        new_owner_type: str = "individual"
    ) -> Optional[RegisteredAsset]:
        """Transfer asset ownership."""
        asset = self._assets.get(paid)
        if not asset:
            return None
        
        old_owner = asset.owner_id
        
        asset_dict = asset.model_dump()
        asset_dict["owner_id"] = new_owner_id
        asset_dict["owner_type"] = new_owner_type
        asset_dict["status"] = AssetStatus.TRANSFERRED
        asset_dict["updated_at"] = datetime.utcnow()
        
        updated = RegisteredAsset(**asset_dict)
        self._assets[paid] = updated
        
        # Write to Ledger
        if self.ledger_client:
            await self.ledger_client.write_event(
                source="core",
                event_type="ASSET_TRANSFERRED",
                asset_id=str(paid),
                anchor_id=asset.anchor_id,
                payload={
                    "paid": str(paid),
                    "from_owner": old_owner,
                    "to_owner": new_owner_id,
                    "to_owner_type": new_owner_type,
                },
            )
        
        return updated
    
    async def list_by_owner(self, owner_id: str) -> list[RegisteredAsset]:
        """List all assets for an owner."""
        return [a for a in self._assets.values() if a.owner_id == owner_id]
