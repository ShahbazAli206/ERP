'use client';

import { motion } from 'motion/react';

/**
 * Next.js remounts `template.tsx` (unlike `layout.tsx`) on every navigation
 * within this route group, which is exactly what we want for a per-page
 * enter transition — module pages fade/slide in on every route change
 * without needing per-page boilerplate.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-1 flex-col gap-4"
    >
      {children}
    </motion.div>
  );
}
