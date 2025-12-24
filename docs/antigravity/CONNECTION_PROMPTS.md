# Antigravity Connection Prompts

Use the prompts below when wiring Antigravity to Proveniq Core services. Replace the placeholder values
with your environment-specific credentials.

## Firebase (Admin SDK + JWT Verification)

**Prompt**

```
You are integrating Antigravity with Proveniq Core. Configure Firebase Admin SDK access for server-side
JWT verification. Use the following inputs:

- Firebase Project ID: <FIREBASE_PROJECT_ID>
- Service account JSON path: <GOOGLE_APPLICATION_CREDENTIALS>
- Expected audience: <FIREBASE_PROJECT_ID>

Return the steps to initialize Firebase Admin and verify bearer tokens in FastAPI.
```

**Notes**

- Ensure the service account has access to `Firebase Authentication Admin` role.
- Validate that `authorization` headers include `Bearer <JWT>`.

## Cloud MCT (API Integration)

**Prompt**

```
You are integrating Antigravity with Proveniq Core. Configure Cloud MCT API access with the following
inputs:

- Base URL: <CLOUD_MCT_BASE_URL>
- API key: <CLOUD_MCT_API_KEY>
- Project ID: <CLOUD_MCT_PROJECT_ID>
- Timeout (seconds): <CLOUD_MCT_TIMEOUT_SECONDS>

Provide the HTTP headers and request skeleton for posting inspection evidence metadata.
```

**Notes**

- Use `Authorization: Bearer <CLOUD_MCT_API_KEY>` and `X-Project-Id: <CLOUD_MCT_PROJECT_ID>`.
- Include a stable `source` and `actor` value per request for auditability.
