import { NextRequest } from "next/server";
import { ProveniqCore } from "@/src";
import { success, badRequest, error } from "@/lib/api/response";
import { requireApiKey } from "@/lib/api/serviceAuth";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiKey(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();

    if (!body || !Array.isArray(body.photos)) {
      return badRequest("Invalid input: photos array required");
    }

    const result = await ProveniqCore.Genome.generateGenome(body);
    return success(result);

  } catch (err: any) {
    return error("INTERNAL_ERROR", err.message || "Internal Server Error", 500);
  }
}
