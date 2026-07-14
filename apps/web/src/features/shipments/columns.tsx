'use client';

import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import type { ShipmentListItem } from './api';
import { ShipmentStatusBadge } from './shipment-status-badge';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export const shipmentColumns: ColumnDef<ShipmentListItem>[] = [
  {
    accessorKey: 'shipmentNumber',
    header: 'Shipment #',
    cell: ({ row }) => (
      <Link href={`/shipments/${row.original.id}`} className="font-medium text-primary hover:underline">
        {row.original.shipmentNumber}
      </Link>
    ),
  },
  {
    accessorKey: 'containerNumber',
    header: 'Container',
    cell: ({ row }) => row.original.containerNumber ?? '—',
  },
  {
    id: 'route',
    header: 'Route',
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.originPort} <span className="text-muted-foreground">→</span> {row.original.destinationPort}
      </span>
    ),
  },
  {
    accessorKey: 'poNumber',
    header: 'Purchase Order',
    cell: ({ row }) => row.original.poNumber ?? <span className="text-muted-foreground">Standalone</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <ShipmentStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'estimatedArrival',
    header: 'Est. Arrival',
    cell: ({ row }) => formatDate(row.original.estimatedArrival),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
];
