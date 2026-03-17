import { SiteLockGate } from "@/components/site-lock-gate";
import { TreasureHuntApp } from "@/components/treasure-hunt-app";

export default function Home() {
  return (
    <SiteLockGate>
      <TreasureHuntApp />
    </SiteLockGate>
  );
}
