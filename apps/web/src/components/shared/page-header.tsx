'use client';

import { motion } from 'motion/react';

/**
 * Standard heading block for every module page — a title, optional
 * description, and an optional right-aligned actions slot (e.g. a "New
 * Supplier" button). Render this at the top of every `app/(app)/**\/page.tsx`
 * for a consistent look across all 14 modules.
 *
 * Design: frosted-glass card with a gradient left-edge accent bar and a
 * glowing brand gradient title. The right slot floats actions flush-right.
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
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      // Card-style header: glass + gradient background + brand ring
      className="relative flex flex-col gap-4 overflow-hidden rounded-xl border border-border/40 bg-linear-to-r from-primary/6 via-primary/3 to-transparent px-5 py-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
    >
      {/* Left-edge gradient accent bar — 3-stop brand gradient with glow */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-linear-to-b from-brand-1 via-brand-2 to-brand-3"
        style={{ boxShadow: '2px 0 12px 0 color-mix(in oklch, var(--brand-1), transparent 45%)' }}
      />

      <div className="flex items-start gap-3 pl-1">
        <div className="space-y-1">
          {/* Bold gradient title — slightly larger than before */}
          <h1 className="text-[1.6rem] font-bold tracking-tight text-gradient-brand leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground leading-snug">{description}</p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </motion.div>
  );
}
