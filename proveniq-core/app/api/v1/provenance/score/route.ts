import { NextRequest } from "next/server";
import { ProveniqCore } from "@/src";
import { success, badRequest, error } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
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
