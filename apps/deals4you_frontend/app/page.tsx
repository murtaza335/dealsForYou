import { HomeDashboard } from "@/components/HomeDashboard";
import { SharedLayout } from "@/components/shared-layout";

export default function HomePage() {
  return (
    <SharedLayout activeTab="home">
      <HomeDashboard />
    </SharedLayout>
  );
}