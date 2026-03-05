import { ChildFriendlyDashboard } from "@/components/dashboard/ChildFriendlyDashboard";
import { TokenUsageCard } from "@/components/dashboard/TokenUsageCard";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <TokenUsageCard />
      <ChildFriendlyDashboard />
    </div>
  );
}
