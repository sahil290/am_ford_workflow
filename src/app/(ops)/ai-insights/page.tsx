import { ControlTowerScreen } from "@/components/control-tower/control-tower-screen";
import { getControlTowerSnapshot } from "@/server/query-services/control-tower-query-service";

export default async function AIInsightsPage() {
  const snapshot = await getControlTowerSnapshot();

  return <ControlTowerScreen snapshot={snapshot} initialViewMode="ai-insights" />;
}
