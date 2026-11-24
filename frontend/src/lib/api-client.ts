const API_BASE_URL =
     process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export class ApiClientError extends Error {
     constructor(
          message: string,
          public statusCode: number,
          public code: string,
          public details?: unknown,
     ) {
          super(message);
          this.name = "ApiClientError";
     }
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
     if (isRefreshing && refreshPromise) {
          return refreshPromise;
     }

     isRefreshing = true;
     refreshPromise = (async () => {
          try {
               const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
                    method: "POST",
                    credentials: "include",
               });
               return res.ok;
          } catch {
               return false;
          } finally {
               isRefreshing = false;
               refreshPromise = null;
          }
     })();

     return refreshPromise;
}

export async function apiFetch<T>(
     endpoint: string,
     options: RequestInit = {},
     retry = true,
): Promise<T> {
     const res = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          credentials: "include",
          headers: {
               "Content-Type": "application/json",
               ...options.headers,
          },
     });

     // Attempt silent refresh once on 401 (except on auth endpoints themselves)
     if (
          res.status === 401 &&
          retry &&
          !endpoint.startsWith("/auth/login") &&
          !endpoint.startsWith("/auth/register") &&
          !endpoint.startsWith("/auth/refresh")
     ) {
          const refreshed = await refreshSession();
          if (refreshed) {
               return apiFetch<T>(endpoint, options, false);
          }
     }

     const body = await res.json().catch(() => null);

     if (!res.ok || !body?.success) {
          throw new ApiClientError(
               body?.error?.message || "Something went wrong",
               res.status,
               body?.error?.code || "UNKNOWN_ERROR",
               body?.error?.details,
          );
     }

     return body.data as T;
}
