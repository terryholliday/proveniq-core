
import { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

export enum ErrorCode {
    INVALID_REQUEST = 'INVALID_REQUEST',
    UNRECOGNIZED_LEDGER_EVENT_TYPE = 'UNRECOGNIZED_LEDGER_EVENT_TYPE',
    STATE_INCOMPLETE = 'STATE_INCOMPLETE',
    LEDGER_READ_FAILED = 'LEDGER_READ_FAILED',
    AUTH_REQUIRED = 'AUTH_REQUIRED',
    AUTH_INVALID = 'AUTH_INVALID',
    INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export class AppError extends Error {
    constructor(public code: ErrorCode, message: string, public details?: any) {
        super(message);
    }
}

export function errorHandler(error: Error, request: FastifyRequest, reply: FastifyReply) {
    if (error instanceof AppError) {
        reply.status(400).send({
            schema_version: "1.0.0",
            correlation_id: (request.id as string) || "unknown",
            error: {
                code: error.code,
                message: error.message,
                details: error.details
            }
        });
        return;
    }

    if (error instanceof ZodError) {
        reply.status(400).send({
            schema_version: "1.0.0",
            correlation_id: (request.id as string) || "unknown",
            error: {
                code: ErrorCode.INVALID_REQUEST,
                message: "Schema Validation Failed",
                details: error.errors
            }
        });
        return;
    }

    console.error("Unhandled Error:", error);
    reply.status(500).send({
        schema_version: "1.0.0",
        correlation_id: (request.id as string) || "unknown",
        error: {
            code: ErrorCode.INTERNAL_ERROR,
            message: "Internal Server Error"
        }
    });
}
