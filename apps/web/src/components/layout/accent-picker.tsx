'use client';

import { useState } from 'react';
import { PaletteIcon, CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMounted } from '@/hooks/use-mounted';

const ACCENTS = [
  { key: 'violet', label: 'Violet', swatch: 'oklch(0.58 0.2 264)' },
  { key: 'emerald', label: 'Emerald', swatch: 'oklch(0.6 0.16 155)' },
  { key: 'rose', label: 'Rose', swatch: 'oklch(0.6 0.22 15)' },
  { key: 'amber', label: 'Amber', swatch: 'oklch(0.68 0.17 70)' },
] as const;

const STORAGE_KEY = 'erp-accent';

/** Accent-color theme picker — independent of light/dark mode (see `theme-toggle.tsx`). Persists to localStorage and sets `data-accent` on `<html>`, matched by the presets in globals.css. */
export function AccentPicker() {
  const mounted = useMounted();
  // Lazy init (not an effect): reads the value the blocking script in
  // app/layout.tsx already applied to `<html>` before hydration. Only ever
  // rendered after `mounted` below, so no SSR/client mismatch.
  const [accent, setAccent] = useState<string>(
    () => (typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY)) || 'violet'
  );

  function apply(key: string) {
    setAccent(key);
    window.localStorage.setItem(STORAGE_KEY, key);
    if (key === 'violet') {
      document.documentElement.removeAttribute('data-accent');
    } else {
      document.documentElement.setAttribute('data-accent', key);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
        <PaletteIcon />
        <span className="sr-only">Choose accent color</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Accent color</DropdownMenuLabel>
          {ACCENTS.map((option) => (
            <DropdownMenuItem key={option.key} onClick={() => apply(option.key)}>
              <span
                className="size-3.5 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: option.swatch }}
                aria-hidden
              />
              {option.label}
              {mounted && accent === option.key && <CheckIcon className="ml-auto size-3.5" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
