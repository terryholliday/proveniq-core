import { NextRequest } from "next/server";
import { forbidden } from "./response";
import { hasScope, validateApiKey } from "./apiKey";

export async function requireApiKey(
  request: NextRequest,
  scopes: string[] = []
): Promise<
  | { ok: false; response: Response }
  | { ok: true; data: { id: string; userId: string | null; organizationId: string | null; scopes: string[] } }
> {
  const result = await validateApiKey(request);

  if (!result.valid) {
    return { ok: false, response: result.response };
  }

  if (scopes.length > 0 && !scopes.every((scope) => hasScope(result.data, scope))) {
    return { ok: false, response: forbidden("Insufficient scope") };
  }

  return { ok: true, data: result.data };
}
