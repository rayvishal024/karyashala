// src/shared/theme/theme-toggle.tsx
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
     const { theme, toggleTheme } = useTheme();
     const [mounted, setMounted] = useState(false);

     useEffect(() => {
          setMounted(true);
     }, []);

     const isDark = mounted ? theme === "dark" : true;

     return (
          <button
               type="button"
               onClick={toggleTheme}
               aria-label="Toggle theme"
               title={isDark ? "Switch to light theme" : "Switch to dark theme"}
               style={{
                    backgroundColor: "var(--bg-surface)",
                    borderColor: "var(--border-hairline)",
                    color: "var(--text-primary)",
               }}
               className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border transition-colors hover:opacity-85"
          >
               {/* ChaiCode-inspired half-shaded contrast circle */}
               <svg
                    viewBox="0 0 20 20"
                    className="h-4 w-4"
                    fill="none"
                    aria-hidden="true"
               >
                    <circle
                         cx="10"
                         cy="10"
                         r="7.5"
                         stroke="currentColor"
                         strokeWidth="1.6"
                    />
                    <path
                         d="M10 2.5A7.5 7.5 0 0 1 10 17.5V2.5Z"
                         fill="currentColor"
                    />
               </svg>
          </button>
     );
}