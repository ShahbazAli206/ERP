import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumbs } from './breadcrumbs';
import { ThemeToggle } from './theme-toggle';
import { AccentPicker } from './accent-picker';
import { NotificationBell } from './notification-bell';
import { UserMenu } from './user-menu';

/** Top bar for the protected shell: sidebar toggle + breadcrumbs on the left, utility icons + user menu on the right. */
export function TopNav() {
  return (
    <header className="glass sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/70 px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-1 h-5" />
      <Breadcrumbs />
      <div className="ml-auto flex items-center gap-1">
        <NotificationBell />
        <AccentPicker />
        <ThemeToggle />
        <Separator orientation="vertical" className="mx-1 h-5" />
        <UserMenu />
      </div>
    </header>
  );
}
