import { useSyncExternalStore } from 'react';

function subscribe() {
  return () => {};
}

/**
 * True only after the client has hydrated — the standard way to gate
 * rendering that must differ between server and client (e.g. reading
 * `next-themes`' resolved theme, which is unknown during SSR).
 *
 * Deliberately implemented with `useSyncExternalStore` (server snapshot
 * `false`, client snapshot `true`) rather than the classic
 * `useState(false)` + `useEffect(() => setMounted(true), [])` pattern —
 * that pattern trips the `react-hooks/set-state-in-effect` lint rule
 * shipped in `eslint-config-next` 16 (calling setState synchronously inside
 * an effect body). This is the lint-clean equivalent.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
