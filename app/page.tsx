import { readHuntContent } from "@/lib/content-store";
import { SiteLockGate } from "@/components/site-lock-gate";
import { TreasureHuntApp } from "@/components/treasure-hunt-app";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { huntConfig, treasureSteps } = await readHuntContent();

  return (
    <SiteLockGate config={huntConfig}>
      <TreasureHuntApp huntConfig={huntConfig} treasureSteps={treasureSteps} />
    </SiteLockGate>
  );
}
