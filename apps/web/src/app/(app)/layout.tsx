import { AuthProvider } from '@/features/auth/use-auth';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

/**
 * Shell for every protected page (everything except /login and
 * /forgot-password). `src/proxy.ts` guarantees a session cookie is present
 * before any request reaches here — this layout doesn't re-check it, it
 * just renders the shell and lets `AuthProvider` fetch the user profile for
 * the sidebar/top nav.
 *
 * Phase 8 module pages are plain children of this layout, e.g.
 * `app/(app)/suppliers/page.tsx` — they automatically get the sidebar, top
 * nav, and breadcrumbs with zero per-page boilerplate.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="app-backdrop" aria-hidden />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <TopNav />
          <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  );
}
