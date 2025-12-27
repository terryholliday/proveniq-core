"""PROVENIQ Core - Ledger Client

Client for writing events to the PROVENIQ Ledger service.
"""

import json
import hashlib
from datetime import datetime
from typing import Optional
from uuid import uuid4

import httpx


class LedgerClient:
    """
    Client for the PROVENIQ Ledger service.
    
    Provides write-through to the immutable event store.
    """
    
    def __init__(self, base_url: str = "http://localhost:8006/api/v1", api_key: Optional[str] = None):
        self.base_url = base_url
        self.api_key = api_key
        self._client = None
    
    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            headers = {"Content-Type": "application/json"}
            if self.api_key:
                headers["x-api-key"] = self.api_key
            self._client = httpx.AsyncClient(headers=headers, timeout=30.0)
        return self._client
    
    def _compute_payload_hash(self, payload: dict) -> str:
        """Compute SHA-256 hash of canonical payload."""
        canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(canonical.encode()).hexdigest()
    
    async def write_event(
        self,
        source: str,
        event_type: str,
        payload: dict,
        asset_id: Optional[str] = None,
        anchor_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> dict:
        """
        Write an event to the Ledger.
        
        Returns the Ledger receipt with event_id and entry_hash.
        """
        client = self._get_client()
        
        # Add canonical hash to payload
        payload_with_hash = {
            **payload,
            "canonical_hash": self._compute_payload_hash(payload),
        }
        
        event_body = {
            "source": source,
            "event_type": event_type,
            "payload": payload_with_hash,
        }
        
        if asset_id:
            event_body["asset_id"] = asset_id
        if anchor_id:
            event_body["anchor_id"] = anchor_id
        if actor_id:
            event_body["actor_id"] = actor_id
        if correlation_id:
            event_body["correlation_id"] = correlation_id
        
        try:
            response = await client.post(f"{self.base_url}/events", json=event_body)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            # Log error but don't fail the operation
            print(f"[LedgerClient] Write failed: {e}")
            return {
                "event_id": None,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }
    
    async def get_asset_events(self, asset_id: str, limit: int = 100) -> list[dict]:
        """Get all events for an asset."""
        client = self._get_client()
        
        try:
            response = await client.get(
                f"{self.base_url}/assets/{asset_id}/events",
                params={"limit": limit}
            )
            response.raise_for_status()
            data = response.json()
            return data.get("events", [])
        except httpx.HTTPError as e:
            print(f"[LedgerClient] Read failed: {e}")
            return []
    
    async def get_anchor_events(self, anchor_id: str, limit: int = 100) -> list[dict]:
        """Get all events for an anchor."""
        client = self._get_client()
        
        try:
            response = await client.get(
                f"{self.base_url}/anchors/{anchor_id}/events",
                params={"limit": limit}
            )
            response.raise_for_status()
            data = response.json()
            return data.get("events", [])
        except httpx.HTTPError as e:
            print(f"[LedgerClient] Read failed: {e}")
            return []
    
    async def verify_integrity(self, from_seq: int = 1, limit: int = 10000) -> dict:
        """Verify Ledger integrity."""
        client = self._get_client()
        
        try:
            response = await client.get(
                f"{self.base_url}/integrity/verify",
                params={"from": from_seq, "limit": limit}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            print(f"[LedgerClient] Integrity check failed: {e}")
            return {"valid": False, "error": str(e)}
    
    async def close(self):
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None
