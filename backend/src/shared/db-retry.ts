const RETRYABLE_DB_CODES = new Set(["P1017", "EAI_AGAIN"]);

function isRetryableDbError(error: unknown, depth = 0): boolean {
     if (depth > 3 || !error || typeof error !== "object") return false;

     const candidate = error as {
          code?: unknown;
          cause?: unknown;
          originalError?: unknown;
     };

     if (
          typeof candidate.code === "string" &&
          RETRYABLE_DB_CODES.has(candidate.code)
     ) {
          return true;
     }

     return (
          isRetryableDbError(candidate.cause, depth + 1) ||
          isRetryableDbError(candidate.originalError, depth + 1)
     );
}

export async function withTransientDbRetry<T>(
     operation: () => Promise<T>,
): Promise<T> {
     try {
          return await operation();
     } catch (error) {
          if (!isRetryableDbError(error)) throw error;

          await new Promise((resolve) => setTimeout(resolve, 100));
          return operation();
     }
}
