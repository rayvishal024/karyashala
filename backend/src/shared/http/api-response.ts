
import type { Response } from "express";

export interface PaginationMeta {
     page: number;
     limit: number;
     total: number;
     totalPages: number;
}

export interface ApiSuccessResponse<T> {
     success: true;
     message: string;
     data: T;
     meta: PaginationMeta | null;
}

export interface ApiErrorResponse {
     success: false;
     error: {
          code: string;
          message: string;
          details?: unknown;
     };
     requestId: string;
}

export function sendSuccess<T>(
     res: Response,
     data: T,
     message = "Request successful",
     statusCode = 200,
     meta: PaginationMeta | null = null,
): Response<ApiSuccessResponse<T>> {
     return res.status(statusCode).json({
          success: true,
          message,
          data,
          meta,
     });
}
