import { z } from 'zod';

/**
 * Sentinel used by the "link to a purchase order" select for its "Standalone
 * shipment (no PO)" option — Base UI's `Select.Item` can't take an empty
 * string value, so this stands in for "no selection" and is converted back
 * to `undefined` before the payload is sent to the API.
 */
export const NO_PURCHASE_ORDER = 'none';

/** Turns an empty `<input type="date">` string into `undefined` instead of an Invalid Date. */
const optionalDateInput = z.preprocess(
  (value) => (value === '' || value === undefined || value === null ? undefined : value),
  z.coerce.date().optional(),
);

const currencyCode = z
  .string()
  .trim()
  .length(3, 'Use a 3-letter currency code, e.g. USD')
  .transform((value) => value.toUpperCase());

const nonNegativeAmount = z.coerce.number({ error: 'Enter a number' }).nonnegative('Must be 0 or more');
const positiveRate = z.coerce.number({ error: 'Enter a number' }).positive('Must be greater than 0');

export const shipmentItemFormSchema = z.object({
  productId: z.string().min(1, 'Select a product'),
  quantity: z.coerce.number({ error: 'Enter a quantity' }).int('Whole numbers only').positive('Must be at least 1'),
});

export const createShipmentSchema = z.object({
  purchaseOrderId: z.string().default(NO_PURCHASE_ORDER),
  containerNumber: z.string().trim().optional(),
  originPort: z.string().trim().min(1, 'Origin port is required'),
  destinationPort: z.string().trim().min(1, 'Destination port is required'),
  estimatedArrival: optionalDateInput,
  freightCost: nonNegativeAmount,
  insuranceCost: nonNegativeAmount,
  dutyCost: nonNegativeAmount,
  customsCharges: nonNegativeAmount,
  currency: currencyCode,
  exchangeRateToBase: positiveRate,
  items: z.array(shipmentItemFormSchema).min(1, 'Add at least one item'),
});

/** Input (pre-parse, all-strings-from-inputs) vs. output (post-coercion) shapes for `useForm`'s 3-generic form. */
export type CreateShipmentFormInput = z.input<typeof createShipmentSchema>;
export type CreateShipmentFormValues = Omit<z.output<typeof createShipmentSchema>, 'purchaseOrderId'> & {
  purchaseOrderId?: string;
};

export const updateShipmentSchema = z.object({
  containerNumber: z.string().trim().optional(),
  originPort: z.string().trim().min(1, 'Origin port is required'),
  destinationPort: z.string().trim().min(1, 'Destination port is required'),
  estimatedArrival: optionalDateInput,
  freightCost: nonNegativeAmount,
  insuranceCost: nonNegativeAmount,
  dutyCost: nonNegativeAmount,
  customsCharges: nonNegativeAmount,
  currency: currencyCode,
  exchangeRateToBase: positiveRate,
});

export type UpdateShipmentFormInput = z.input<typeof updateShipmentSchema>;
export type UpdateShipmentFormValues = z.output<typeof updateShipmentSchema>;

export const updateShipmentStatusSchema = z.object({
  status: z.string().min(1, 'Select a status'),
  note: z.string().trim().optional(),
  actualArrival: optionalDateInput,
});

export type UpdateShipmentStatusFormInput = z.input<typeof updateShipmentStatusSchema>;
export type UpdateShipmentStatusFormValues = z.output<typeof updateShipmentStatusSchema>;
