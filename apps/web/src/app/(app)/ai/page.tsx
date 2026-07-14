'use client';

import { PageHeader } from '@/components/shared/page-header';
import { AiDashboardView } from '@/features/ai/ai-dashboard-view';

export default function Page() {
  return (
    <>
      <PageHeader title="AI Dashboard" description="Demand forecasts and AI-generated recommendations." />
      <AiDashboardView />
    </>
  );
}
