// src/shared/ui/alert.tsx
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

type AlertVariant = "error" | "warning" | "success";

const styles: Record<AlertVariant, string> = {
     error:
          "bg-[var(--status-danger-bg)] text-[var(--status-danger)] border-[var(--status-danger-border)]",
     warning:
          "bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-[var(--status-warning-border)]",
     success:
          "bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success-border)]",
};

const icons: Record<AlertVariant, typeof AlertCircle> = {
     error: AlertCircle,
     warning: AlertTriangle,
     success: CheckCircle2,
};

export function Alert({
     variant = "error",
     children,
     className = "",
}: {
     variant?: AlertVariant;
     children: React.ReactNode;
     className?: string;
}) {
     const Icon = icons[variant];
     return (
          <div
               role="alert"
               className={`flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-xs leading-relaxed ${styles[variant]} ${className}`}
          >
               <Icon className="mt-0.5 h-4 w-4 shrink-0" />
               <div className="flex-1">{children}</div>
          </div>
     );
}