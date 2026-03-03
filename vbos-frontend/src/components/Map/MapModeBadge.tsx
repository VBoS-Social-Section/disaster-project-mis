/**
 * Floating mode badge in bottom-right corner (e.g. "Climate Trends • 2023")
 */
import { useScenario } from "@/hooks/useScenario";
import { useDateStore } from "@/store/date-store";

export function MapModeBadge() {
  const scenario = useScenario();
  const { year } = useDateStore();

  if (scenario.id !== "climate") return null;

  return (
    <div
      className="pointer-events-none absolute bottom-12 right-4 z-[1000] rounded-md border border-border bg-card px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground shadow-sm"
      aria-hidden
    >
      Climate Trends • {year || new Date().getFullYear()}
    </div>
  );
}
