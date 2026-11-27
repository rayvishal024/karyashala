"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAuth, authApi } from "@/features/auth";
import { ThemeToggle } from "@/shared/theme/theme-toggle";
import { ApiClientError } from "@/lib/api-client";

function LoginContent() {
     const { login } = useAuth();
     const searchParams = useSearchParams();
     const oauthError = searchParams.get("error");
     const requestedRedirect = searchParams.get("redirect");
     const redirectTo =
          requestedRedirect?.startsWith("/") &&
          !requestedRedirect.startsWith("//") &&
          !requestedRedirect.includes("\\") &&
          !/[\u0000-\u001f\u007f]/.test(requestedRedirect)
               ? requestedRedirect
               : null;
     const safeRedirect = redirectTo ?? "/dashboard";

     const [email, setEmail] = useState("");
     const [password, setPassword] = useState("");
     const [showPassword, setShowPassword] = useState(false);
     const [error, setError] = useState<string | null>(
          oauthError ? "Google sign-in failed. Please try again." : null,
     );
     const [submitting, setSubmitting] = useState(false);

     const handleSubmit = async (e: FormEvent) => {
          e.preventDefault();
          if (submitting) return;
          setError(null);
          setSubmitting(true);

          try {
               await login({ email: email.trim(), password }, redirectTo);
          } catch (err) {
               if (err instanceof ApiClientError) {
                    setError(err.message);
               } else {
                    setError("Unable to sign in. Please try again.");
               }
          } finally {
               setSubmitting(false);
          }
     };

     const registerHref = redirectTo
          ? `/register?redirect=${encodeURIComponent(redirectTo)}`
          : "/register";

     return (
          <div
               style={{
                    backgroundColor: "var(--bg-canvas)",
                    color: "var(--text-primary)",
               }}
               className="flex min-h-screen flex-col"
          >
               <header className="flex items-center justify-between px-6 py-4">
                    <Link href="/" className="flex items-center gap-2.5">
                         <span
                              style={{
                                   backgroundColor: "var(--cta-bg)",
                                   color: "var(--cta-fg)",
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold"
                         >
                              K
                         </span>
                         <span className="text-sm font-semibold tracking-tight">
                              Karyashala
                         </span>
                    </Link>
                    <ThemeToggle />
               </header>

               <main className="flex flex-1 items-center justify-center px-4 pb-12">
                    <div className="w-full max-w-[390px]">
                         <div
                              style={{
                                   backgroundColor: "var(--bg-surface)",
                                   borderColor: "var(--border-hairline)",
                              }}
                              className="rounded-lg border p-6 sm:p-7"
                         >
                              <h1 className="text-lg font-semibold tracking-tight">Sign in</h1>
                              <p
                                   style={{ color: "var(--text-secondary)" }}
                                   className="mt-1 text-xs"
                              >
                                   Sign in with your email and password to access your workspaces.
                              </p>

                              {error && (
                                   <div
                                        style={{
                                             backgroundColor: "var(--danger-bg)",
                                             borderColor: "var(--danger-border)",
                                             color: "var(--danger-text)",
                                        }}
                                        className="mt-4 rounded-md border px-3 py-2 text-xs"
                                   >
                                        {error}
                                   </div>
                              )}

                              <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
                                   <div>
                                        <label
                                             htmlFor="email"
                                             className="mb-1.5 block text-xs font-medium"
                                        >
                                             Email
                                        </label>
                                        <input
                                             id="email"
                                             type="email"
                                             autoComplete="email"
                                             required
                                             value={email}
                                             onChange={(e) => setEmail(e.target.value)}
                                             placeholder="you@example.com"
                                             style={{
                                                  backgroundColor: "var(--bg-subtle)",
                                                  borderColor: "var(--border-input)",
                                                  color: "var(--text-primary)",
                                             }}
                                             className="h-9 w-full rounded-md border px-3 text-sm focus:outline-none"
                                        />
                                   </div>

                                   <div>
                                        <label
                                             htmlFor="password"
                                             className="mb-1.5 block text-xs font-medium"
                                        >
                                             Password
                                        </label>
                                        <div className="relative">
                                             <input
                                                  id="password"
                                                  type={showPassword ? "text" : "password"}
                                                  autoComplete="current-password"
                                                  required
                                                  value={password}
                                                  onChange={(e) => setPassword(e.target.value)}
                                                  placeholder="••••••••"
                                                  style={{
                                                       backgroundColor: "var(--bg-subtle)",
                                                       borderColor: "var(--border-input)",
                                                       color: "var(--text-primary)",
                                                  }}
                                                  className="h-9 w-full rounded-md border px-3 pr-9 text-sm focus:outline-none"
                                             />
                                             <button
                                                  type="button"
                                                  onClick={() => setShowPassword((s) => !s)}
                                                  aria-label={showPassword ? "Hide password" : "Show password"}
                                                  style={{ color: "var(--text-muted)" }}
                                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                                             >
                                                  {showPassword ? (
                                                       <EyeOff className="h-4 w-4" />
                                                  ) : (
                                                       <Eye className="h-4 w-4" />
                                                  )}
                                             </button>
                                        </div>
                                   </div>

                                   <button
                                        type="submit"
                                        disabled={submitting}
                                        style={{
                                             backgroundColor: "var(--cta-bg)",
                                             color: "var(--cta-fg)",
                                        }}
                                        className="mt-1 h-9 w-full cursor-pointer rounded-md text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                                   >
                                        {submitting ? "Signing in..." : "Sign in"}
                                   </button>
                              </form>

                              <div className="my-5 flex items-center gap-3">
                                   <div
                                        style={{ backgroundColor: "var(--border-hairline)" }}
                                        className="h-px flex-1"
                                   />
                                   <span
                                        style={{ color: "var(--text-muted)" }}
                                        className="text-[11px] uppercase tracking-wider"
                                   >
                                        or
                                   </span>
                                   <div
                                        style={{ backgroundColor: "var(--border-hairline)" }}
                                        className="h-px flex-1"
                                   />
                              </div>

                              <a
                                   href={authApi.getGoogleAuthUrl(safeRedirect)}
                                   onClick={() => {
                                        try {
                                             window.sessionStorage.setItem(
                                                  "post_auth_redirect",
                                                  safeRedirect,
                                             );
                                        } catch {
                                             setError(
                                                  "Unable to save your redirect preference.",
                                             );
                                        }
                                   }}
                                   style={{
                                        backgroundColor: "var(--bg-subtle)",
                                        borderColor: "var(--border-input)",
                                        color: "var(--text-primary)",
                                   }}
                                   className="flex h-9 w-full items-center justify-center gap-2 rounded-md border text-sm font-medium transition-opacity hover:opacity-90"
                              >
                                   Continue with Google
                              </a>
                         </div>

                         <p
                              style={{ color: "var(--text-secondary)" }}
                              className="mt-4 text-center text-xs"
                         >
                              Don&apos;t have an account?{" "}
                              <Link
                                   href={registerHref}
                                   style={{ color: "var(--text-primary)" }}
                                   className="font-medium underline underline-offset-4"
                              >
                                   Create one
                              </Link>
                         </p>
                    </div>
               </main>
          </div>
     );
}

export default function LoginPage() {
     return (
          <Suspense
               fallback={
                    <div
                         style={{ backgroundColor: "var(--bg-canvas)" }}
                         className="flex min-h-screen items-center justify-center"
                    >
                         <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    </div>
               }
          >
               <LoginContent />
          </Suspense>
     );
}