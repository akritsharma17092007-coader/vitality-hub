import { useEffect, useState } from "react";
import { Pill, Bell, Droplet } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MedicineForm } from "./medicine-form";
import { ReminderForm } from "./reminder-form";
import { WaterQuickAdd } from "./water-quick-add";

type Tab = "menu" | "medicine" | "reminder" | "water";

export function AddSheet({
  open, onOpenChange, initialTab,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialTab?: "medicine" | "reminder" | "water";
}) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "menu");
  const close = () => { setTab("menu"); onOpenChange(false); };

  useEffect(() => {
    if (open) setTab(initialTab ?? "menu");
  }, [open, initialTab]);

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) setTab("menu"); onOpenChange(v); }}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>
            {tab === "menu" && "Add new"}
            {tab === "medicine" && "New medicine"}
            {tab === "reminder" && "New reminder"}
            {tab === "water" && "Log water"}
          </SheetTitle>
        </SheetHeader>
        {tab === "menu" && (
          <div className="mt-4 grid grid-cols-1 gap-2">
            <MenuBtn icon={<Pill />} label="Medicine" hint="Schedule doses and refills" onClick={() => setTab("medicine")} />
            <MenuBtn icon={<Bell />} label="Custom reminder" hint="Exercise, prayer, meeting…" onClick={() => setTab("reminder")} />
            <MenuBtn icon={<Droplet />} label="Water" hint="Log a quick intake" onClick={() => setTab("water")} />
          </div>
        )}
        {tab === "medicine" && <MedicineForm onDone={close} />}
        {tab === "reminder" && <ReminderForm onDone={close} />}
        {tab === "water" && <WaterQuickAdd onDone={close} />}
      </SheetContent>
    </Sheet>
  );
}

function MenuBtn({ icon, label, hint, onClick }: { icon: React.ReactNode; label: string; hint: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent"
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span>
      <span className="flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}
