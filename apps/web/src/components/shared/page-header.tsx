import { motion } from 'motion/react';

/**
 * Standard heading block for every module page — a title, optional
 * description, and an optional right-aligned actions slot (e.g. a "New
 * Supplier" button). Render this at the top of every `app/(app)/**\/page.tsx`
 * for a consistent look across all 14 modules.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <span aria-hidden className="mt-1.5 h-6 w-1 shrink-0 rounded-full bg-gradient-brand" />
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-gradient-brand">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </motion.div>
  );
}
