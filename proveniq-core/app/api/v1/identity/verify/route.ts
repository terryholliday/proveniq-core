import { NextRequest } from "next/server";
import { ProveniqCore } from "@/src";
import { success, badRequest, error } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.assetClass || !body.identifiers) {
      return badRequest("Invalid input: assetClass and identifiers required");
    }

    const result = await ProveniqCore.Identity.verifyIdentity(body.assetClass, body.identifiers);
    return success(result);

  } catch (err: any) {
    return error("INTERNAL_ERROR", err.message || "Internal Server Error", 500);
  }
}
