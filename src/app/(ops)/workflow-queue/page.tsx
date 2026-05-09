import { ControlTowerScreen } from "@/components/control-tower/control-tower-screen";
import { getControlTowerSnapshot } from "@/server/query-services/control-tower-query-service";

export default async function WorkflowQueuePage() {
  const snapshot = await getControlTowerSnapshot();

  return <ControlTowerScreen snapshot={snapshot} initialViewMode="workflow-queue" />;
}
