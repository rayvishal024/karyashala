import type { Metadata } from "next";
import { ThemeProvider } from "@/shared/theme/theme-provider";
import { AuthProvider } from "@/features/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Karyashala — Collaborative Workspaces",
  description: "Structured multi-tenant workspaces for teams.",
};

const themeInitScript = `
  (function() {
    try {
      var stored = localStorage.getItem('karyashala-theme');
      var resolved = (stored === 'light' || stored === 'dark')
        ? stored
        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.classList.add(resolved);
      document.documentElement.style.colorScheme = resolved;
    } catch (e) {
      document.documentElement.classList.add('dark');
    }
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] antialiased">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}