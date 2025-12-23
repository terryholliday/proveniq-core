"""PROVENIQ Core - Trust Kernel backend (FastAPI)."""

import hashlib
import io
import json
import os
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

import firebase_admin
from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from firebase_admin import auth, credentials
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Integer, Text, select
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func


# -----------------------------------------------------------------------------
# Settings
# -----------------------------------------------------------------------------

class StorageProvider(str, Enum):
    GCS = "gcs"
    S3 = "s3"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "PROVENIQ Core"
    debug: bool = False
    port: int = 8000

    database_url: str

    firebase_project_id: str
    google_application_credentials: Optional[str] = None
    allowed_origins: str = "http://localhost:3000,http://localhost:5173"

    storage_provider: StorageProvider = StorageProvider.GCS
    gcs_bucket_name: Optional[str] = None
    gcs_project_id: Optional[str] = None
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: Optional[str] = "us-east-1"
    s3_bucket_name: Optional[str] = None

    presign_ttl_seconds: int = 300
    max_upload_size_mb: int = 50

    cloud_mct_base_url: Optional[str] = None
    cloud_mct_api_key: Optional[str] = None
    cloud_mct_project_id: Optional[str] = None
    cloud_mct_timeout_seconds: int = 30
    cloud_mct_verify_ssl: bool = True


settings = Settings()


# -----------------------------------------------------------------------------
# Database
# -----------------------------------------------------------------------------
engine = create_async_engine(settings.database_url, echo=False, future=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
Base = declarative_base()


async def get_db() -> AsyncSession:
    async with SessionLocal() as session:
        yield session


# -----------------------------------------------------------------------------
# Models
# -----------------------------------------------------------------------------


class Organization(Base):
    __tablename__ = "organizations"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    properties = relationship("Property", back_populates="org")
    users = relationship("User", back_populates="org")


class User(Base):
    __tablename__ = "users"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    firebase_uid = Column(String(128), unique=True, nullable=False)
    email = Column(String(255), nullable=False)
    full_name = Column(String(255))
    org_id = Column(PGUUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    org = relationship("Organization", back_populates="users")


class Property(Base):
    __tablename__ = "properties"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    org_id = Column(PGUUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    name = Column(String(255), nullable=False)
    address = Column(String(512), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    org = relationship("Organization", back_populates="properties")
    units = relationship("Unit", back_populates="property")


class Unit(Base):
    __tablename__ = "units"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    property_id = Column(PGUUID(as_uuid=True), ForeignKey("properties.id"), nullable=False)
    unit_number = Column(String(50), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    property = relationship("Property", back_populates="units")
    leases = relationship("Lease", back_populates="unit")


class LeaseStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    ACTIVE = "active"
    ENDED = "ended"


class Lease(Base):
    __tablename__ = "leases"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    unit_id = Column(PGUUID(as_uuid=True), ForeignKey("units.id"), nullable=False)
    tenant_email = Column(String(255), nullable=False)
    status = Column(String(32), default=LeaseStatus.DRAFT.value, nullable=False)
    invite_token_hash = Column(String(128), nullable=True)
    invite_expires_at = Column(DateTime, nullable=True)
    invite_sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    unit = relationship("Unit", back_populates="leases")
    inspections = relationship("Inspection", back_populates="lease")


class InspectionStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    SIGNED = "signed"


class InspectionType(str, Enum):
    MOVE_IN = "move_in"
    MOVE_OUT = "move_out"


class Inspection(Base):
    __tablename__ = "inspections"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    lease_id = Column(PGUUID(as_uuid=True), ForeignKey("leases.id"), nullable=False)
    inspection_type = Column(String(32), nullable=False)
    status = Column(String(32), default=InspectionStatus.DRAFT.value, nullable=False)
    content_hash = Column(String(64), nullable=True)
    signed_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    lease = relationship("Lease", back_populates="inspections")
    items = relationship("InspectionItem", back_populates="inspection")
    evidence = relationship("InspectionEvidence", back_populates="inspection")


class InspectionItem(Base):
    __tablename__ = "inspection_items"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    inspection_id = Column(PGUUID(as_uuid=True), ForeignKey("inspections.id"), nullable=False)
    room_key = Column(String(100), nullable=False)
    item_key = Column(String(100), nullable=False)
    ordinal = Column(Integer, nullable=False, default=0)
    notes = Column(Text, nullable=True)
    condition_rating = Column(Integer, nullable=True)
    is_damaged = Column(Boolean, default=False)
    damage_description = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    inspection = relationship("Inspection", back_populates="items")
    evidence = relationship("InspectionEvidence", back_populates="item")


class InspectionEvidence(Base):
    __tablename__ = "inspection_evidence"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    inspection_id = Column(PGUUID(as_uuid=True), ForeignKey("inspections.id"), nullable=False)
    item_id = Column(PGUUID(as_uuid=True), ForeignKey("inspection_items.id"), nullable=False)
    storage_provider = Column(String(10), nullable=False)
    object_path = Column(String(512), nullable=False, unique=True)
    mime_type = Column(String(128), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_hash = Column(String(64), nullable=True)
    is_confirmed = Column(Boolean, default=False)
    created_by = Column(PGUUID(as_uuid=True), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    inspection = relationship("Inspection", back_populates="evidence")
    item = relationship("InspectionItem", back_populates="evidence")


# -----------------------------------------------------------------------------
# Firebase Init
# -----------------------------------------------------------------------------
if not firebase_admin._apps:
    cred = None
    if settings.google_application_credentials:
        cred = credentials.Certificate(settings.google_application_credentials)
    firebase_admin.initialize_app(cred)


class AuthenticatedUser(BaseModel):
    uid: str
    email: Optional[str] = None


async def get_current_user(request: Request) -> AuthenticatedUser:
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    token = auth_header.split(" ", 1)[1]
    try:
        decoded = auth.verify_id_token(token)
        return AuthenticatedUser(uid=decoded["uid"], email=decoded.get("email"))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


# -----------------------------------------------------------------------------
# Schemas
# -----------------------------------------------------------------------------


class PresignRequest(BaseModel):
    item_id: UUID
    file_name: str
    mime_type: str
    file_size_bytes: int


class PresignResponse(BaseModel):
    upload_url: str
    object_path: str
    expires_at: datetime


class ConfirmEvidenceRequest(BaseModel):
    item_id: UUID
    object_path: str
    mime_type: str
    file_size_bytes: int
    file_hash: Optional[str] = None


class SubmitInspectionRequest(BaseModel):
    items: list[dict] = Field(default_factory=list)


class MagicLinkRequest(BaseModel):
    lease_id: UUID
    email: str


class MagicLinkResponse(BaseModel):
    message: str
    lease_id: UUID
    tenant_email: str


# -----------------------------------------------------------------------------
# Storage (stubbed presign for now)
# -----------------------------------------------------------------------------


def generate_object_path(org_id: UUID, inspection_id: UUID, item_id: UUID, file_name: str) -> str:
    ext = file_name.split(".")[-1] if "." in file_name else ""
    return f"orgs/{org_id}/inspections/{inspection_id}/items/{item_id}/{uuid4()}.{ext}"


async def presign_upload(object_path: str, mime_type: str, ttl_seconds: int) -> tuple[str, datetime]:
    expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)
    if settings.storage_provider == StorageProvider.GCS:
        from google.cloud import storage as gcs_storage
        client = gcs_storage.Client(project=settings.gcs_project_id)
        bucket = client.bucket(settings.gcs_bucket_name)
        blob = bucket.blob(object_path)
        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(seconds=ttl_seconds),
            method="PUT",
            content_type=mime_type,
        )
        return url, expires_at
    else:
        import boto3
        s3 = boto3.client(
            "s3",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
        )
        url = s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.s3_bucket_name,
                "Key": object_path,
                "ContentType": mime_type,
            },
            ExpiresIn=ttl_seconds,
        )
        return url, expires_at


# -----------------------------------------------------------------------------
# Hashing helpers
# -----------------------------------------------------------------------------

def canonicalize_inspection(items: list[dict]) -> str:
    # Sort keys and drop nulls/None
    def clean(obj):
        if isinstance(obj, dict):
            return {k: clean(v) for k, v in sorted(obj.items()) if v is not None}
        if isinstance(obj, list):
            return [clean(x) for x in obj]
        return obj
    cleaned = clean(items)
    return json.dumps(cleaned, separators=(",", ":"), sort_keys=True)


def compute_content_hash(items: list[dict]) -> str:
    canonical = canonicalize_inspection(items)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


# -----------------------------------------------------------------------------
# FastAPI app
# -----------------------------------------------------------------------------

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.allowed_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/health")
async def health():
    return {"status": "healthy", "service": settings.app_name}


@app.post("/auth/magic-link/request", response_model=MagicLinkResponse)
async def request_magic_link(
    payload: MagicLinkRequest,
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    lease = await db.get(Lease, payload.lease_id)
    if not lease:
        raise HTTPException(status_code=404, detail="Lease not found")
    # Verify email matches lease tenant email
    if lease.tenant_email.lower() != payload.email.lower():
        raise HTTPException(status_code=400, detail="Email does not match lease tenant email")

    # Generate token hash (simple hash for now)
    token = os.urandom(32).hex()
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    lease.invite_token_hash = token_hash
    lease.invite_expires_at = datetime.utcnow() + timedelta(hours=24)
    lease.invite_sent_at = datetime.utcnow()
    lease.status = LeaseStatus.PENDING.value
    await db.commit()

    return MagicLinkResponse(
        message="Invite sent",
        lease_id=payload.lease_id,
        tenant_email=payload.email,
    )


@app.post("/inspections/{inspection_id}/evidence/presign", response_model=PresignResponse)
async def presign_evidence(
    inspection_id: UUID,
    payload: PresignRequest,
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    inspection = await db.get(Inspection, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    if inspection.status != InspectionStatus.DRAFT.value:
        raise HTTPException(status_code=400, detail="Inspection not in draft state")

    # Get org_id via join to avoid lazy load issues
    org_row = await db.execute(
        select(Property.org_id)
        .join(Unit, Unit.property_id == Property.id)
        .join(Lease, Lease.unit_id == Unit.id)
        .where(Lease.id == inspection.lease_id)
    )
    org_id = org_row.scalar_one_or_none()
    if not org_id:
        raise HTTPException(status_code=400, detail="Org not found for lease")

    object_path = generate_object_path(org_id=org_id, inspection_id=inspection_id, item_id=payload.item_id, file_name=payload.file_name)
    upload_url, expires_at = await presign_upload(object_path, payload.mime_type, settings.presign_ttl_seconds)
    return PresignResponse(upload_url=upload_url, object_path=object_path, expires_at=expires_at)


@app.post("/inspections/{inspection_id}/evidence/confirm")
async def confirm_evidence(
    inspection_id: UUID,
    payload: ConfirmEvidenceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    inspection = await db.get(Inspection, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    if inspection.status != InspectionStatus.DRAFT.value:
        raise HTTPException(status_code=400, detail="Inspection not in draft state")

    # HEAD check to verify object exists and size matches
    head_ok = False
    head_size = None
    if settings.storage_provider == StorageProvider.GCS:
        from google.cloud import storage as gcs_storage
        client = gcs_storage.Client(project=settings.gcs_project_id)
        bucket = client.bucket(settings.gcs_bucket_name)
        blob = bucket.blob(payload.object_path)
        if blob.exists():
            blob.reload()
            head_ok = True
            head_size = blob.size
    else:
        import boto3
        s3 = boto3.client(
            "s3",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
        )
        try:
            resp = s3.head_object(Bucket=settings.s3_bucket_name, Key=payload.object_path)
            head_ok = True
            head_size = resp.get("ContentLength")
        except Exception:
            head_ok = False

    if not head_ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File not found in storage")
    if head_size is not None and head_size != payload.file_size_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File size mismatch")

    ev = InspectionEvidence(
        inspection_id=inspection_id,
        item_id=payload.item_id,
        storage_provider=settings.storage_provider.value,
        object_path=payload.object_path,
        mime_type=payload.mime_type,
        file_size=payload.file_size_bytes,
        file_hash=payload.file_hash,
        is_confirmed=True,
        created_by=UUID(current_user.uid) if len(current_user.uid) == 36 else uuid4(),
    )
    db.add(ev)
    await db.commit()
    return {"status": "confirmed", "object_path": payload.object_path, "file_size": head_size}


@app.post("/inspections/{inspection_id}/submit")
async def submit_inspection(
    inspection_id: UUID,
    payload: SubmitInspectionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    inspection = await db.get(Inspection, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    if inspection.status != InspectionStatus.DRAFT.value:
        raise HTTPException(status_code=400, detail="Inspection not in draft state")

    content_hash = compute_content_hash(payload.items)
    inspection.content_hash = content_hash
    inspection.status = InspectionStatus.SUBMITTED.value
    inspection.submitted_at = datetime.utcnow()
    await db.commit()
    return {"status": "submitted", "content_hash": content_hash}


@app.get("/inspections/{inspection_id}/certificate.pdf")
async def inspection_certificate(inspection_id: UUID, db: AsyncSession = Depends(get_db), current_user: AuthenticatedUser = Depends(get_current_user)):
    inspection = await db.get(Inspection, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    if inspection.status == InspectionStatus.DRAFT.value:
        raise HTTPException(status_code=400, detail="Inspection not submitted")
    if not inspection.content_hash:
        raise HTTPException(status_code=400, detail="Missing content hash")

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(72, 720, "PROVENIQ Core - Inspection Certificate")
    c.setFont("Helvetica", 11)
    lines = [
        f"Inspection ID: {inspection_id}",
        f"Lease ID: {inspection.lease_id}",
        f"Content Hash (SHA-256): {inspection.content_hash}",
        f"Status: {inspection.status}",
        f"Submitted At: {inspection.submitted_at}",
        f"Signed At: {inspection.signed_at}",
        f"Generated At: {datetime.utcnow().isoformat()}",
    ]
    y = 690
    for line in lines:
        c.drawString(72, y, line)
        y -= 18
    c.showPage()
    c.save()
    buffer.seek(0)
    headers = {
        "Content-Disposition": f'inline; filename="inspection_{inspection_id}_certificate.pdf"'
    }
    return StreamingResponse(buffer, media_type="application/pdf", headers=headers)


@app.get("/")
async def root():
    return {"service": settings.app_name, "version": "1.0.0"}
