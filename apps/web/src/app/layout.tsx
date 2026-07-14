import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/query-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ERP Demo",
  description: "Import Business Management System — demo ERP",
};

/**
 * Root layout. Providers here are global (needed on /login and
 * /forgot-password too, not just the protected shell):
 *   - ThemeProvider (next-themes): class-strategy dark mode, see
 *     `components/layout/theme-toggle.tsx` for the toggle control.
 *   - QueryProvider: the single app-wide React Query client.
 *   - TooltipProvider: required once by shadcn's tooltip primitive.
 *   - Toaster: sonner toast host, call `toast(...)` from `sonner` anywhere.
 *
 * The auth-specific provider (`AuthProvider`, which fetches the current
 * user) is intentionally NOT here — it lives in `app/(app)/layout.tsx`
 * since only protected pages need the logged-in user's profile.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <TooltipProvider>
              {children}
              <Toaster richColors closeButton position="top-right" />
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
