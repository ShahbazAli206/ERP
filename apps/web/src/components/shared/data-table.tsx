'use client';

import {
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  InboxIcon,
  SearchIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/**
 * Generic server-driven data table — the standard way every module renders
 * a list view. Wraps `@tanstack/react-table` in "manual" mode: this
 * component only renders the current page and reports pagination/sort/
 * search state changes back to the caller — it does NOT fetch data or slice
 * arrays client-side. The caller's React Query hook owns the actual
 * `apiClient.getPaginated()` call, using the same `page`/`pageSize` (and, if
 * sortable/searchable, `sortBy`/`sortOrder`/`search`) params the API
 * expects (see `src/lib/api-client.ts` / `src/shared/pagination.ts` on the
 * API side).
 *
 * ── Usage ────────────────────────────────────────────────────────────────
 *
 *   const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
 *   const [search, setSearch] = useState('');
 *   const debouncedSearch = useDebouncedValue(search);
 *   const query = useQuery({
 *     queryKey: ['suppliers', 'list', pagination, debouncedSearch],
 *     queryFn: () => suppliersApi.list({
 *       page: pagination.pageIndex + 1, // API is 1-indexed, TanStack Table is 0-indexed
 *       pageSize: pagination.pageSize,
 *       search: debouncedSearch,
 *     }),
 *   });
 *
 *   <DataTable
 *     columns={columns}
 *     data={query.data?.data ?? []}
 *     rowCount={query.data?.pagination.total ?? 0}
 *     pagination={pagination}
 *     onPaginationChange={setPagination}
 *     search={search}
 *     onSearchChange={setSearch}
 *     isLoading={query.isLoading}
 *   />
 * ─────────────────────────────────────────────────────────────────────────
 */
export function DataTable<TData>({
  columns,
  data,
  rowCount,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  isLoading,
  emptyTitle = 'No results',
  emptyDescription = 'Try adjusting your search or filters.',
  getRowId,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TanStack Table's own ColumnDef examples use `any` here since each column's value type varies independently of TData.
  columns: ColumnDef<TData, any>[];
  data: TData[];
  /** Total row count across ALL pages (from the API's `meta.pagination.total`), not `data.length`. */
  rowCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  getRowId?: (row: TData) => string;
}) {
  const pageCount = Math.max(1, Math.ceil(rowCount / pagination.pageSize));

  const table = useReactTable({
    data,
    columns,
    state: { pagination, ...(sorting ? { sorting } : {}) },
    onPaginationChange,
    onSortingChange,
    manualPagination: true,
    manualSorting: true,
    pageCount,
    rowCount,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      {onSearchChange && (
        // Pill-shaped search bar with a brand-coloured icon
        <div className="relative max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-primary/60" />
          <Input
            value={search ?? ''}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 rounded-full border-border/60 bg-background/70 pl-9 shadow-sm backdrop-blur-sm focus-visible:ring-primary/30"
          />
        </div>
      )}

      {/* Table container — rounded with a subtle brand ring */}
      <div className="overflow-x-auto rounded-xl border border-border/50 shadow-sm ring-1 ring-primary/5">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = Boolean(onSortingChange) && header.column.getCanSort();
                  const sortState = header.column.getIsSorted();
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : canSort ? (
                        // Sortable column — icon changes colour when active
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-3 h-7 font-semibold uppercase tracking-widest text-[0.7rem] text-primary/75 hover:text-primary"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortState === 'asc' && <ArrowUpIcon className="text-primary" />}
                          {sortState === 'desc' && <ArrowDownIcon className="text-primary" />}
                          {!sortState && <ArrowUpDownIcon className="text-muted-foreground/40" />}
                        </Button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: Math.min(pagination.pageSize, 8) }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-4 w-full max-w-40" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-56 text-center">
                  <Empty className="border-0 p-0">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <InboxIcon />
                      </EmptyMedia>
                      <EmptyTitle>{emptyTitle}</EmptyTitle>
                      <EmptyDescription>{emptyDescription}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination rowCount={rowCount} pagination={pagination} pageCount={pageCount} onPaginationChange={onPaginationChange} />
    </div>
  );
}

function DataTablePagination({
  rowCount,
  pagination,
  pageCount,
  onPaginationChange,
}: {
  rowCount: number;
  pagination: PaginationState;
  pageCount: number;
  onPaginationChange: OnChangeFn<PaginationState>;
}) {
  const { pageIndex, pageSize } = pagination;
  const from = rowCount === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min(rowCount, (pageIndex + 1) * pageSize);

  const setPageIndex = (updater: number) => onPaginationChange((prev) => ({ ...prev, pageIndex: updater }));
  const setPageSize = (size: number) => onPaginationChange({ pageIndex: 0, pageSize: size });

  return (
    // Pagination toolbar — row count left, controls right
    <div className="flex flex-col-reverse items-center justify-between gap-4 rounded-lg border border-border/40 bg-muted/30 px-4 py-2.5 sm:flex-row">
      {/* Row count badge */}
      <p className="text-xs font-medium text-muted-foreground">
        {rowCount === 0 ? (
          'No rows'
        ) : (
          <>
            Showing{' '}
            <span className="font-semibold text-foreground">{from}–{to}</span>
            {' '}of{' '}
            <span className="font-semibold text-foreground">{rowCount}</span>
          </>
        )}
      </p>

      <div className="flex items-center gap-5">
        {/* Rows-per-page selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rows per page</span>
          <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger size="sm" className="w-[70px] rounded-lg border-primary/20 bg-background text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page navigation buttons */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" disabled={pageIndex === 0} onClick={() => setPageIndex(0)}
            className="size-7 rounded-lg border-border/50 hover:border-primary/40 hover:bg-primary/8">
            <ChevronsLeftIcon className="size-3.5" />
          </Button>
          <Button variant="outline" size="icon" disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}
            className="size-7 rounded-lg border-border/50 hover:border-primary/40 hover:bg-primary/8">
            <ChevronLeftIcon className="size-3.5" />
          </Button>

          {/* Current page pill */}
          <span className="min-w-20 rounded-md bg-primary/10 px-3 py-1 text-center text-xs font-semibold text-primary">
            {pageCount === 0 ? 0 : pageIndex + 1} / {pageCount}
          </span>

          <Button
            variant="outline" size="icon"
            disabled={pageIndex >= pageCount - 1}
            onClick={() => setPageIndex(pageIndex + 1)}
            className="size-7 rounded-lg border-border/50 hover:border-primary/40 hover:bg-primary/8"
          >
            <ChevronRightIcon className="size-3.5" />
          </Button>
          <Button
            variant="outline" size="icon"
            disabled={pageIndex >= pageCount - 1}
            onClick={() => setPageIndex(pageCount - 1)}
            className="size-7 rounded-lg border-border/50 hover:border-primary/40 hover:bg-primary/8"
          >
            <ChevronsRightIcon className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
