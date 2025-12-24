
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { resolveAsset } from "../aggregator/resolver";
import { AppError, ErrorCode } from "../errors/errors";

export async function assetRoutes(server: FastifyInstance) {
    server.get('/:asset_id', async (request, reply) => {
        const params = z.object({ asset_id: z.string().uuid() }).safeParse(request.params);

        if (!params.success) {
            throw new AppError(ErrorCode.INVALID_REQUEST, "Invalid Asset UUID", params.error);
        }

        const { asset_id } = params.data;
        const result = await resolveAsset(asset_id);

        reply.send(result);
    });
}
