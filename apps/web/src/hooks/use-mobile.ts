import * as React from "react"

// Rewritten from the shadcn-generated version to use useSyncExternalStore
// instead of a useEffect+setState mount/resize handler. The generated
// version trips the newer `react-hooks/set-state-in-effect` lint rule
// (part of eslint-config-next 16's React Compiler ruleset) — calling
// setState synchronously inside an effect body. useSyncExternalStore is
// the correct primitive for "read a mutable external source, with a
// distinct SSR snapshot" and needs no effect at all.
const MOBILE_BREAKPOINT = 768

function subscribe(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
