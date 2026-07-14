import { HardHatIcon } from 'lucide-react';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

/**
 * Placeholder body for a module page whose real Phase 8 content hasn't been
 * built yet. Every one of the 14 module routes renders this today so the
 * full nav/breadcrumb/shell/RBAC-visibility can be clicked through
 * end-to-end before Phase 8 replaces each page's `<ComingSoon />` with real
 * list/detail/create/edit views.
 */
export function ComingSoon({ module }: { module: string }) {
  return (
    <Empty className="min-h-[50vh] flex-1">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HardHatIcon />
        </EmptyMedia>
        <EmptyTitle>{module} is coming in Phase 8</EmptyTitle>
        <EmptyDescription>
          This module&apos;s list, detail, and form views will be built next. Navigation, layout,
          and role-based visibility for {module} are already live.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
