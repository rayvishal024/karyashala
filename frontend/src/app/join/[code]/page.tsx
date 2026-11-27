// src/app/join/[code]/page.tsx
import { Suspense, use } from "react";
import { JoinCodeCard } from "@/features/workspace-invites";

function JoinCodeView({
     paramsPromise,
}: {
     paramsPromise: Promise<{ code: string }>;
}) {
     const { code } = use(paramsPromise);
     return <JoinCodeCard code={code} />;
}

export default function JoinCodePage({
     params,
}: {
     params: Promise<{ code: string }>;
}) {
     return (
          <Suspense
               fallback={
                    <div
                         style={{ backgroundColor: "var(--bg-canvas)" }}
                         className="flex min-h-screen items-center justify-center text-xs"
                    >
                         Joining workspace...
                    </div>
               }
          >
               <JoinCodeView paramsPromise={params} />
          </Suspense>
     );
}