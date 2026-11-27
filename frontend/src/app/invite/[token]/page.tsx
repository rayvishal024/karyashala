// src/app/invite/[token]/page.tsx
import { Suspense, use } from "react";
import { InviteAcceptCard } from "@/features/workspace-invites";

function InviteTokenView({
     paramsPromise,
}: {
     paramsPromise: Promise<{ token: string }>;
}) {
     const { token } = use(paramsPromise);
     return <InviteAcceptCard token={token} />;
}

export default function InviteTokenPage({
     params,
}: {
     params: Promise<{ token: string }>;
}) {
     return (
          <Suspense
               fallback={
                    <div
                         style={{ backgroundColor: "var(--bg-canvas)" }}
                         className="flex min-h-screen items-center justify-center text-xs"
                    >
                         Loading invitation...
                    </div>
               }
          >
               <InviteTokenView paramsPromise={params} />
          </Suspense>
     );
}