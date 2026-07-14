/**
 * Client-side mirror of the shipment status machine implemented in
 * `apps/api/src/modules/shipments/shipments.service.ts` (`ALLOWED_STATUS_TRANSITIONS`).
 * The API is authoritative — this only drives which options the status-transition
 * control offers; a stale mirror would just mean an extra round-trip 400, not a
 * data-integrity issue. Keep in sync if the backend map changes.
 *
 * Status walk: BOOKED -> IN_TRANSIT -> ARRIVED_AT_PORT -> CUSTOMS_CLEARANCE -> DELIVERED,
 * with DELAYED reachable laterally from any non-terminal state and able to resume
 * into any later stage (not a dead end).
 */
export const SHIPMENT_STATUSES = [
  'BOOKED',
  'IN_TRANSIT',
  'ARRIVED_AT_PORT',
  'CUSTOMS_CLEARANCE',
  'DELAYED',
  'DELIVERED',
] as const;

export type ShipmentStatusValue = (typeof SHIPMENT_STATUSES)[number];

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatusValue, string> = {
  BOOKED: 'Booked',
  IN_TRANSIT: 'In Transit',
  ARRIVED_AT_PORT: 'Arrived at Port',
  CUSTOMS_CLEARANCE: 'Customs Clearance',
  DELAYED: 'Delayed',
  DELIVERED: 'Delivered',
};

export const ALLOWED_STATUS_TRANSITIONS: Record<ShipmentStatusValue, ShipmentStatusValue[]> = {
  BOOKED: ['IN_TRANSIT', 'DELAYED'],
  IN_TRANSIT: ['ARRIVED_AT_PORT', 'DELAYED'],
  ARRIVED_AT_PORT: ['CUSTOMS_CLEARANCE', 'DELAYED'],
  CUSTOMS_CLEARANCE: ['DELIVERED', 'DELAYED'],
  // A delay is lateral, not a dead end — resumes into any later stage.
  DELAYED: ['IN_TRANSIT', 'ARRIVED_AT_PORT', 'CUSTOMS_CLEARANCE', 'DELIVERED'],
  DELIVERED: [],
};

export type StatusTone = 'neutral' | 'good' | 'warning' | 'critical';

export const SHIPMENT_STATUS_TONE: Record<ShipmentStatusValue, StatusTone> = {
  BOOKED: 'neutral',
  IN_TRANSIT: 'warning',
  ARRIVED_AT_PORT: 'warning',
  CUSTOMS_CLEARANCE: 'warning',
  DELAYED: 'critical',
  DELIVERED: 'good',
};

export function isShipmentStatus(value: string): value is ShipmentStatusValue {
  return (SHIPMENT_STATUSES as readonly string[]).includes(value);
}

export function shipmentStatusLabel(status: string): string {
  return isShipmentStatus(status) ? SHIPMENT_STATUS_LABELS[status] : status;
}

export function allowedNextStatuses(status: string): ShipmentStatusValue[] {
  return isShipmentStatus(status) ? ALLOWED_STATUS_TRANSITIONS[status] : [];
}

/**
 * Mirrors the API's real restrictions (see `shipments.service.ts`'s `update`/`delete`):
 * - Edit (PATCH) is blocked only once a shipment is DELIVERED — every earlier
 *   status (including DELAYED) is still editable. Note this is looser than the
 *   "restricted once past BOOKED" framing in the module spec; the live service
 *   code is the source of truth here.
 * - Delete is far stricter: allowed ONLY while still BOOKED.
 */
export function canEditShipment(status: string): boolean {
  return status !== 'DELIVERED';
}

export function canDeleteShipment(status: string): boolean {
  return status === 'BOOKED';
}
