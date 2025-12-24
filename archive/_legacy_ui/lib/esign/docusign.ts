// DocuSign E-Signature Integration
// Requires: npm install docusign-esign

export interface DocuSignConfig {
  integrationKey: string;
  userId: string;
  accountId: string;
  basePath: string;
  privateKey: string;
}

export interface SignatureRecipient {
  email: string;
  name: string;
  recipientId: string;
  routingOrder?: number;
}

export interface SignatureRequest {
  documentBase64: string;
  documentName: string;
  recipients: SignatureRecipient[];
  emailSubject: string;
  emailBody?: string;
  returnUrl?: string;
  webhookUrl?: string;
}

export interface EnvelopeResponse {
  envelopeId: string;
  status: string;
  statusDateTime: string;
  uri: string;
}

export interface SigningUrlResponse {
  url: string;
  expiresAt: Date;
}

function getConfig(): DocuSignConfig {
  const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
  const userId = process.env.DOCUSIGN_USER_ID;
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
  const basePath = process.env.DOCUSIGN_BASE_PATH || "https://demo.docusign.net/restapi";
  const privateKey = process.env.DOCUSIGN_PRIVATE_KEY || "";

  if (!integrationKey || !userId || !accountId) {
    throw new Error("DocuSign configuration missing. Set DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID, and DOCUSIGN_ACCOUNT_ID");
  }

  return { integrationKey, userId, accountId, basePath, privateKey };
}

let cachedAccessToken: { token: string; expiresAt: Date } | null = null;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedAccessToken && cachedAccessToken.expiresAt > new Date()) {
    return cachedAccessToken.token;
  }

  const config = getConfig();

  // JWT Grant flow for server-to-server authentication
  const jwtPayload = {
    iss: config.integrationKey,
    sub: config.userId,
    aud: "account-d.docusign.com",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    scope: "signature impersonation",
  };

  // In production, use proper JWT signing with the private key
  // This is a placeholder - actual implementation requires docusign-esign SDK
  const response = await fetch("https://account-d.docusign.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: Buffer.from(JSON.stringify(jwtPayload)).toString("base64"),
    }),
  });

  if (!response.ok) {
    throw new Error(`DocuSign auth failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: new Date(Date.now() + (data.expires_in - 60) * 1000),
  };

  return cachedAccessToken.token;
}

export async function createEnvelope(request: SignatureRequest): Promise<EnvelopeResponse> {
  const config = getConfig();
  const accessToken = await getAccessToken();

  const envelope = {
    emailSubject: request.emailSubject,
    emailBlurb: request.emailBody,
    documents: [
      {
        documentBase64: request.documentBase64,
        name: request.documentName,
        fileExtension: request.documentName.split(".").pop() || "pdf",
        documentId: "1",
      },
    ],
    recipients: {
      signers: request.recipients.map((r, index) => ({
        email: r.email,
        name: r.name,
        recipientId: r.recipientId || String(index + 1),
        routingOrder: r.routingOrder || index + 1,
        tabs: {
          signHereTabs: [
            {
              documentId: "1",
              pageNumber: "1",
              xPosition: "100",
              yPosition: "700",
            },
          ],
          dateSignedTabs: [
            {
              documentId: "1",
              pageNumber: "1",
              xPosition: "100",
              yPosition: "750",
            },
          ],
        },
      })),
    },
    status: "sent",
    eventNotification: request.webhookUrl
      ? {
          url: request.webhookUrl,
          loggingEnabled: true,
          requireAcknowledgment: true,
          envelopeEvents: [
            { envelopeEventStatusCode: "completed" },
            { envelopeEventStatusCode: "declined" },
            { envelopeEventStatusCode: "voided" },
          ],
          recipientEvents: [
            { recipientEventStatusCode: "Completed" },
            { recipientEventStatusCode: "Declined" },
          ],
        }
      : undefined,
  };

  const response = await fetch(
    `${config.basePath}/v2.1/accounts/${config.accountId}/envelopes`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(envelope),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create envelope: ${error}`);
  }

  return response.json();
}

export async function getSigningUrl(
  envelopeId: string,
  recipient: SignatureRecipient,
  returnUrl: string
): Promise<SigningUrlResponse> {
  const config = getConfig();
  const accessToken = await getAccessToken();

  const recipientView = {
    returnUrl,
    authenticationMethod: "none",
    email: recipient.email,
    userName: recipient.name,
    recipientId: recipient.recipientId,
  };

  const response = await fetch(
    `${config.basePath}/v2.1/accounts/${config.accountId}/envelopes/${envelopeId}/views/recipient`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(recipientView),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get signing URL: ${error}`);
  }

  const data = await response.json();

  return {
    url: data.url,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // URLs typically expire in 5 minutes
  };
}

export async function getEnvelopeStatus(envelopeId: string): Promise<EnvelopeResponse> {
  const config = getConfig();
  const accessToken = await getAccessToken();

  const response = await fetch(
    `${config.basePath}/v2.1/accounts/${config.accountId}/envelopes/${envelopeId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get envelope status: ${error}`);
  }

  return response.json();
}

export async function voidEnvelope(envelopeId: string, reason: string): Promise<void> {
  const config = getConfig();
  const accessToken = await getAccessToken();

  const response = await fetch(
    `${config.basePath}/v2.1/accounts/${config.accountId}/envelopes/${envelopeId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "voided",
        voidedReason: reason,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to void envelope: ${error}`);
  }
}

export async function downloadSignedDocument(envelopeId: string): Promise<Buffer> {
  const config = getConfig();
  const accessToken = await getAccessToken();

  const response = await fetch(
    `${config.basePath}/v2.1/accounts/${config.accountId}/envelopes/${envelopeId}/documents/combined`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to download document: ${error}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
