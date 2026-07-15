import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumbs } from './breadcrumbs';
import { ThemeToggle } from './theme-toggle';
import { AccentPicker } from './accent-picker';
import { NotificationBell } from './notification-bell';
import { UserMenu } from './user-menu';

/**
 * Top bar for the protected shell: sidebar toggle + breadcrumbs on the left,
 * utility icons + user menu on the right.
 *
 * Design: frosted-glass surface with a gradient bottom border that uses the
 * brand colour, giving the nav a colorful underline accent.
 */
export function TopNav() {
  return (
    <header
      className="glass sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 bg-background/80 px-4 shadow-sm"
      // Gradient bottom border: transparent top border + brand gradient on the bottom edge
      style={{
        borderBottom: '1.5px solid transparent',
        backgroundImage:
          'linear-gradient(var(--background), var(--background)) padding-box,' +
          'linear-gradient(90deg, var(--brand-1), var(--brand-2), var(--brand-3)) border-box',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      }}
    >
      <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors" />
      <Separator orientation="vertical" className="mr-1 h-5 bg-border/60" />
      <Breadcrumbs />
      <div className="ml-auto flex items-center gap-1">
        <NotificationBell />
        <AccentPicker />
        <ThemeToggle />
        <Separator orientation="vertical" className="mx-1 h-5 bg-border/60" />
        <UserMenu />
      </div>
    </header>
  );
}
