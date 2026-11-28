// src/shared/theme/theme-toggle.tsx
"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

const subscribeToMount = () => () => {};
const getMountedSnapshot = () => true;
const getServerMountedSnapshot = () => false;

export function ThemeToggle() {
     const { theme, toggleTheme } = useTheme();
     const mounted = useSyncExternalStore(
          subscribeToMount,
          getMountedSnapshot,
          getServerMountedSnapshot,
     );
     const isDark = mounted ? theme === "dark" : true;
     const label = isDark ? "Dark" : "Light";

     return (
          <button
               type="button"
               onClick={toggleTheme}
               aria-label={`Theme: ${label}. Switch to ${isDark ? "light" : "dark"} mode`}
               aria-pressed={isDark}
               title={isDark ? "Switch to light theme" : "Switch to dark theme"}
               style={{
                    backgroundColor: "var(--bg-surface)",
                    borderColor: "var(--border-hairline)",
                    color: "var(--text-primary)",
               }}
               className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-2 text-[10px] font-medium transition-colors duration-200 hover:bg-[var(--bg-subtle)]"
          >
               {isDark ? (
                    <Moon aria-hidden="true" className="h-3.5 w-3.5" />
               ) : (
                    <Sun aria-hidden="true" className="h-3.5 w-3.5" />
               )}
               <span>{label}</span>
          </button>
     );
}