import { DealsDashboard } from "@/components/deals-dashboard";
import { SharedLayout } from "@/components/shared-layout";

export default function DealsPage() {
  return (
    <SharedLayout activeTab="deals">
      <DealsDashboard />
    </SharedLayout>
  );
}