'use client';

import { useEffect, useState } from 'react';

/**
 * Debounces a fast-changing value (typically a search input) so callers
 * don't fire a new query on every keystroke. Standard use with the shared
 * `DataTable`'s search box:
 *
 *   const [search, setSearch] = useState('');
 *   const debouncedSearch = useDebouncedValue(search, 300);
 *   const query = useSuppliers({ search: debouncedSearch, page, pageSize });
 *   <DataTable ... search={search} onSearchChange={setSearch} />
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
