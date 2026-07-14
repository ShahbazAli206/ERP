import { PageHeader } from '@/components/shared/page-header';
import { ShipmentCreateForm } from '@/features/shipments/shipment-form';

export default function NewShipmentPage() {
  return (
    <>
      <PageHeader title="Create Shipment" description="Book a new container shipment, optionally linked to a purchase order." />
      <ShipmentCreateForm />
    </>
  );
}
