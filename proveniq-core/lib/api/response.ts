import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId?: string;
    timestamp: string;
    latencyMs?: number;
  };
}

export function success<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

export function error(
  code: string,
  message: string,
  status = 400,
  details?: unknown
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

export function created<T>(data: T): NextResponse<ApiResponse<T>> {
  return success(data, 201);
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(message: string, details?: unknown): NextResponse<ApiResponse> {
  return error("BAD_REQUEST", message, 400, details);
}

export function unauthorized(message = "Unauthorized"): NextResponse<ApiResponse> {
  return error("UNAUTHORIZED", message, 401);
}

export function forbidden(message = "Forbidden"): NextResponse<ApiResponse> {
  return error("FORBIDDEN", message, 403);
}

export function notFound(message = "Not found"): NextResponse<ApiResponse> {
  return error("NOT_FOUND", message, 404);
}

export function conflict(message: string): NextResponse<ApiResponse> {
  return error("CONFLICT", message, 409);
}

export function tooManyRequests(message = "Rate limit exceeded"): NextResponse<ApiResponse> {
  return error("RATE_LIMITED", message, 429);
}

export function internalError(message = "Internal server error"): NextResponse<ApiResponse> {
  return error("INTERNAL_ERROR", message, 500);
}
