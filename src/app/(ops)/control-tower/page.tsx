export const dynamic = 'force-dynamic';

import { ControlTowerScreen } from "@/components/control-tower/control-tower-screen";
import { getControlTowerSnapshot } from "@/server/query-services/control-tower-query-service";

export default async function ControlTowerPage() {
  const snapshot = await getControlTowerSnapshot();

  return <ControlTowerScreen snapshot={snapshot} />;
}
