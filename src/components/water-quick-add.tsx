import { useAddWater } from "@/hooks/use-app-data";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AMOUNTS = [250, 500, 750, 1000];

export function WaterQuickAdd({ onDone }: { onDone: () => void }) {
  const add = useAddWater();
  const log = (amt: number) => {
    add.mutate(amt);
    toast.success(`Added ${amt}ml`);
    onDone();
  };
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {AMOUNTS.map((a) => (
        <Button key={a} variant="outline" className="h-20 flex-col gap-1 rounded-2xl" onClick={() => log(a)}>
          <span className="text-2xl font-semibold">{a}</span>
          <span className="text-xs text-muted-foreground">ml</span>
        </Button>
      ))}
    </div>
  );
}
