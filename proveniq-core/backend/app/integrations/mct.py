"""Cloud MCT integration scaffolding."""

from __future__ import annotations

from pydantic import BaseModel, Field


class CloudMCTConfig(BaseModel):
    base_url: str = Field(..., description="Cloud MCT API base URL")
    api_key: str = Field(..., description="Cloud MCT API key")
    project_id: str = Field(..., description="Cloud MCT project identifier")
    timeout_seconds: int = Field(30, description="HTTP timeout in seconds")
    verify_ssl: bool = Field(True, description="Enable TLS verification")


class CloudMCTClient:
    """Lightweight client structure for future Cloud MCT integration."""

    def __init__(self, config: CloudMCTConfig) -> None:
        self.config = config

    def build_headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.config.api_key}",
            "X-Project-Id": self.config.project_id,
            "Content-Type": "application/json",
        }

    def build_base_payload(self, *, source: str, actor: str) -> dict[str, str]:
        return {
            "source": source,
            "actor": actor,
        }
