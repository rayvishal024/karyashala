// src/shared/theme/theme-provider.tsx
"use client";

import {
     createContext,
     useCallback,
     useContext,
     useEffect,
     useState,
     type ReactNode,
} from "react";

export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
     theme: ResolvedTheme;
     toggleTheme: () => void;
     setTheme: (theme: ResolvedTheme) => void;
}

const STORAGE_KEY = "karyashala-theme";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyTheme(next: ResolvedTheme) {
     const root = document.documentElement;
     root.classList.remove("light", "dark");
     root.classList.add(next);
     root.style.colorScheme = next;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
     const [theme, setThemeState] = useState<ResolvedTheme>("dark");

     useEffect(() => {
          const saved = window.localStorage.getItem(STORAGE_KEY);
          const initial: ResolvedTheme =
               saved === "light" || saved === "dark" ? saved : "dark";
          setThemeState(initial);
          applyTheme(initial);
     }, []);

     const setTheme = useCallback((next: ResolvedTheme) => {
          setThemeState(next);
          window.localStorage.setItem(STORAGE_KEY, next);
          applyTheme(next);
     }, []);

     const toggleTheme = useCallback(() => {
          setThemeState((prev) => {
               const next: ResolvedTheme = prev === "dark" ? "light" : "dark";
               window.localStorage.setItem(STORAGE_KEY, next);
               applyTheme(next);
               return next;
          });
     }, []);

     return (
          <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
               {children}
          </ThemeContext.Provider>
     );
}

export function useTheme() {
     const ctx = useContext(ThemeContext);
     if (!ctx) {
          throw new Error("useTheme must be used within a ThemeProvider");
     }
     return ctx;
}