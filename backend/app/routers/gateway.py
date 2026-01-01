"""PROVENIQ Core - API Gateway Routes

Provides proxy/orchestration endpoints for inter-app communication.
Apps can call Core to coordinate with other services.
"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

import httpx

from app.auth import AuthenticatedUser, get_current_user
router = APIRouter(prefix="/v1/gateway", tags=["gateway"])


# Service URLs (in production, from config)
SERVICE_URLS = {
    "ledger": "http://localhost:8006/api/v1",
    "anchors": "http://localhost:8005/api/v1",
    "protect": "http://localhost:3003/api",
    "transit": "http://localhost:3004/api",
    "home": "http://localhost:9003/api",
    "properties": "http://localhost:8001/api/v1",
    "ops": "http://localhost:8002/api/v1",
    "bids": "http://localhost:3005/api",
    "claimsiq": "http://localhost:3006/api",
    "capital": "http://localhost:3007/api",
    "service": "http://localhost:3008/api",
    "origins": "http://localhost:3009/api",
}


class ServiceHealthResponse(BaseModel):
    service: str
    status: str
    url: str
    latency_ms: Optional[float] = None
    error: Optional[str] = None


class GetQuoteRequest(BaseModel):
    asset_id: UUID
    asset_valuation_micros: str
    security_level: str = "MED"
    last_verified_service_days: int = 0
    transit_damage_history: bool = False
    coverage_type: str = "FULL"
    term_days: int = 365


class CreateShipmentRequest(BaseModel):
    asset_id: UUID
    sender_wallet_id: str
    recipient_wallet_id: str
    declared_value_micros: Optional[str] = None
    anchor_id: Optional[str] = None
    request_insurance: bool = False


class SubmitClaimRequest(BaseModel):
    policy_id: UUID
    claim_type: str  # THEFT, DAMAGE, LOSS
    description: str
    incident_date: str
    claimed_amount_micros: str
    evidence_ids: list[str] = []


@router.get("/health", response_model=list[ServiceHealthResponse])
async def check_all_services(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Check health of all PROVENIQ services."""
    results = []
    
    async with httpx.AsyncClient(timeout=5.0) as client:
        for service, base_url in SERVICE_URLS.items():
            try:
                import time
                start = time.time()
                response = await client.get(f"{base_url.rstrip('/api/v1').rstrip('/api')}/health")
                latency = (time.time() - start) * 1000
                
                if response.status_code == 200:
                    results.append(ServiceHealthResponse(
                        service=service,
                        status="healthy",
                        url=base_url,
                        latency_ms=round(latency, 2),
                    ))
                else:
                    results.append(ServiceHealthResponse(
                        service=service,
                        status="unhealthy",
                        url=base_url,
                        error=f"HTTP {response.status_code}",
                    ))
            except Exception as e:
                results.append(ServiceHealthResponse(
                    service=service,
                    status="unavailable",
                    url=base_url,
                    error=str(e),
                ))
    
    return results


@router.get("/health/{service}", response_model=ServiceHealthResponse)
async def check_service(
    service: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Check health of a specific service."""
    if service not in SERVICE_URLS:
        raise HTTPException(status_code=404, detail=f"Unknown service: {service}")
    
    base_url = SERVICE_URLS[service]
    
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            import time
            start = time.time()
            # Try common health endpoints
            health_url = base_url.rstrip('/api/v1').rstrip('/api') + "/health"
            response = await client.get(health_url)
            latency = (time.time() - start) * 1000
            
            if response.status_code == 200:
                return ServiceHealthResponse(
                    service=service,
                    status="healthy",
                    url=base_url,
                    latency_ms=round(latency, 2),
                )
            else:
                return ServiceHealthResponse(
                    service=service,
                    status="unhealthy",
                    url=base_url,
                    error=f"HTTP {response.status_code}",
                )
        except Exception as e:
            return ServiceHealthResponse(
                service=service,
                status="unavailable",
                url=base_url,
                error=str(e),
            )


@router.post("/protect/quote")
async def get_protect_quote(
    request: GetQuoteRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Get an insurance quote from Protect.
    
    Orchestrates the quote request with proper context.
    """
    import uuid
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f"{SERVICE_URLS['protect']}/quote",
                json={
                    "context": {
                        "schema_version": "1.0.0",
                        "created_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
                        "correlation_id": str(uuid.uuid4()),
                        "idempotency_key": str(uuid.uuid4()),
                        "asset_id": str(request.asset_id),
                        "asset_valuation_micros": request.asset_valuation_micros,
                        "security_level": request.security_level,
                        "last_verified_service_days": request.last_verified_service_days,
                        "transit_damage_history": request.transit_damage_history,
                    },
                    "request": {
                        "schema_version": "1.0.0",
                        "created_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
                        "correlation_id": str(uuid.uuid4()),
                        "idempotency_key": str(uuid.uuid4()),
                        "asset_id": str(request.asset_id),
                        "coverage_type": request.coverage_type,
                        "term_days": request.term_days,
                    },
                }
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Protect service error: {e}")


@router.post("/transit/shipment")
async def create_shipment(
    request: CreateShipmentRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Create a shipment in Transit.
    
    Orchestrates shipment creation with optional insurance.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f"{SERVICE_URLS['transit']}/shipments",
                json={
                    "asset_id": str(request.asset_id),
                    "sender_wallet_id": request.sender_wallet_id,
                    "recipient_wallet_id": request.recipient_wallet_id,
                    "declared_value_micros": request.declared_value_micros,
                    "anchor_id": request.anchor_id,
                    "request_insurance": request.request_insurance,
                }
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Transit service error: {e}")


@router.post("/protect/claim")
async def submit_claim(
    request: SubmitClaimRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Submit a claim to Protect.
    
    Note: Requires authentication in production.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f"{SERVICE_URLS['protect']}/claims",
                json={
                    "policy_id": str(request.policy_id),
                    "claim_type": request.claim_type,
                    "description": request.description,
                    "incident_date": request.incident_date,
                    "claimed_amount_micros": request.claimed_amount_micros,
                    "evidence_ids": request.evidence_ids,
                }
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Protect service error: {e}")


@router.get("/ledger/asset/{asset_id}/events")
async def get_asset_ledger_events(
    asset_id: UUID,
    limit: int = 100,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get all Ledger events for an asset."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(
                f"{SERVICE_URLS['ledger']}/assets/{asset_id}/events",
                params={"limit": limit}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Ledger service error: {e}")
