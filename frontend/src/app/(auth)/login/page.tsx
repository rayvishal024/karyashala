"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ApiClientError } from "@/lib/api-client";

const API_BASE_URL =
     process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export default function LoginPage() {
     const { login } = useAuth();
     const searchParams = useSearchParams();
     const oauthError = searchParams.get("error");

     const [email, setEmail] = useState("");
     const [password, setPassword] = useState("");
     const [error, setError] = useState<string | null>(
          oauthError ? "Google sign-in failed. Please try again." : null,
     );
     const [submitting, setSubmitting] = useState(false);

     const handleSubmit = async (e: FormEvent) => {
          e.preventDefault();
          setError(null);
          setSubmitting(true);

          try {
               await login(email, password);
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

     return (
          <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
               <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
                    <p className="mt-1 text-sm text-gray-600">
                         Welcome back to Karyashala
                    </p>

                    {error && (
                         <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                              {error}
                         </div>
                    )}

                    <a
                         href={`${API_BASE_URL}/auth/google`}
                         className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                         Continue with Google
                    </a>

                    <div className="my-6 flex items-center gap-3">
                         <div className="h-px flex-1 bg-gray-200" />
                         <span className="text-xs uppercase text-gray-400">or</span>
                         <div className="h-px flex-1 bg-gray-200" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                         <div>
                              <label className="block text-sm font-medium text-gray-700">
                                   Email
                              </label>
                              <input
                                   type="email"
                                   required
                                   value={email}
                                   onChange={(e) => setEmail(e.target.value)}
                                   className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none"
                                   placeholder="you@example.com"
                              />
                         </div>

                         <div>
                              <label className="block text-sm font-medium text-gray-700">
                                   Password
                              </label>
                              <input
                                   type="password"
                                   required
                                   value={password}
                                   onChange={(e) => setPassword(e.target.value)}
                                   className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none"
                                   placeholder="••••••••"
                              />
                         </div>

                         <button
                              type="submit"
                              disabled={submitting}
                              className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                         >
                              {submitting ? "Signing in..." : "Sign in"}
                         </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600">
                         Don&apos;t have an account?{" "}
                         <Link href="/register" className="font-medium text-black underline">
                              Create one
                         </Link>
                    </p>
               </div>
          </main>
     );
}
