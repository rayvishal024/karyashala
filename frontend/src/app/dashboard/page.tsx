"use client";

import { useAuth } from "@/context/auth-context";

export default function DashboardPage() {
     const { user, isLoading, logout } = useAuth();

     if (isLoading) {
          return (
               <div className="flex min-h-screen items-center justify-center">
                    <p className="text-sm text-gray-500">Loading session...</p>
               </div>
          );
     }

     return (
          <main className="mx-auto max-w-3xl px-4 py-12">
               <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div>
                         <h1 className="text-xl font-bold text-gray-900">
                              Welcome, {user?.name}
                         </h1>
                         <p className="text-sm text-gray-600">
                              {user?.email} · Provider: {user?.provider} · Role: {user?.role}
                         </p>
                    </div>

                    <button
                         onClick={logout}
                         className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                         Sign out
                    </button>
               </div>
          </main>
     );
}
