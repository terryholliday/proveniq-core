import { NextRequest } from "next/server";
import { ProveniqCore } from "@/src";
import { success, badRequest, error } from "@/lib/api/response";
import { requireApiKey } from "@/lib/api/serviceAuth";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiKey(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    
    // Validate input (Basic check)
    if (!body || typeof body.photoCount !== 'number') {
      return badRequest("Invalid input: ProvenanceScoreInput required");
    }

    const result = ProveniqCore.Provenance.calculateScore(body);
    return success(result);

  } catch (err: any) {
    return error("INTERNAL_ERROR", err.message || "Internal Server Error", 500);
  }
}
