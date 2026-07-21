import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Droplet, Trash2, Settings2 } from "lucide-react";
import { useWater, useAddWater, useDeleteWater, useSettings, useSaveSettings } from "@/hooks/use-app-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

export const Route = createFileRoute("/water")({
  component: WaterPage,
});

const QUICK = [250, 500, 750, 1000];

function WaterPage() {
  const { data: entries = [] } = useWater();
  const { data: settings } = useSettings();
  const add = useAddWater();
  const del = useDeleteWater();
  const saveSettings = useSaveSettings();
  const [openSettings, setOpenSettings] = useState(false);

  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const today = useMemo(
    () => entries.filter((e) => e.timestamp >= startOfToday.getTime()).sort((a, b) => b.timestamp - a.timestamp),
    [entries]
  );
  const consumed = today.reduce((s, e) => s + e.amount, 0);
  const goal = settings?.water.dailyGoal ?? 2500;
  const progress = Math.min(1, consumed / goal);
  const remaining = Math.max(0, goal - consumed);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Water</h1>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, d MMM")}</p>
        </div>
        <Button size="icon" variant="ghost" aria-label="Water settings" onClick={() => setOpenSettings(true)}>
          <Settings2 className="h-5 w-5" />
        </Button>
      </header>

      <section className="card-elevated flex flex-col items-center gap-4 p-6">
        <WaterBottle progress={progress} />
        <div className="text-center">
          <p className="text-3xl font-semibold tabular-nums">
            {(consumed / 1000).toFixed(2)}
            <span className="text-lg text-muted-foreground"> / {(goal / 1000).toFixed(1)} L</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {remaining > 0 ? `${(remaining / 1000).toFixed(2)}L to go` : "Daily goal reached 🎉"}
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">Quick add</h2>
        <div className="grid grid-cols-4 gap-2">
          {QUICK.map((a) => (
            <button
              key={a}
              onClick={() => { add.mutate(a); toast.success(`+${a}ml`); }}
              className="card-elevated flex flex-col items-center gap-1 py-4 transition-transform active:scale-95"
            >
              <Droplet className="h-5 w-5 text-teal" />
              <span className="text-sm font-semibold">{a}</span>
              <span className="text-[10px] text-muted-foreground">ml</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">Today's intake</h2>
        {today.length === 0 ? (
          <div className="card-elevated p-6 text-center text-sm text-muted-foreground">No entries yet today</div>
        ) : (
          <ul className="space-y-2">
            {today.map((e) => (
              <li key={e.id} className="card-elevated flex items-center gap-3 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal/15 text-teal">
                  <Droplet className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{e.amount} ml</p>
                  <p className="text-xs text-muted-foreground">{format(e.timestamp, "HH:mm")}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => del.mutate(e.id)} aria-label="Delete entry">
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Sheet open={openSettings} onOpenChange={setOpenSettings}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader><SheetTitle>Water settings</SheetTitle></SheetHeader>
          {settings && (
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label>Daily goal (ml)</Label>
                <Input type="number" defaultValue={settings.water.dailyGoal}
                  onBlur={(e) => saveSettings.mutate({ ...settings, water: { ...settings.water, dailyGoal: Number(e.target.value) } })} />
              </div>
              <div className="space-y-1.5">
                <Label>Reminder interval (min)</Label>
                <Input type="number" defaultValue={settings.water.intervalMinutes}
                  onBlur={(e) => saveSettings.mutate({ ...settings, water: { ...settings.water, intervalMinutes: Number(e.target.value) } })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Wake time</Label>
                  <Input type="time" defaultValue={settings.water.wakeTime}
                    onBlur={(e) => saveSettings.mutate({ ...settings, water: { ...settings.water, wakeTime: e.target.value } })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Sleep time</Label>
                  <Input type="time" defaultValue={settings.water.sleepTime}
                    onBlur={(e) => saveSettings.mutate({ ...settings, water: { ...settings.water, sleepTime: e.target.value } })} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Reminders will be paused between sleep and wake times.</p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function WaterBottle({ progress }: { progress: number }) {
  const pct = Math.round(progress * 100);
  return (
    <div className="relative flex h-48 w-28 flex-col overflow-hidden rounded-[2rem] border-2 border-teal/40 bg-muted/40">
      <div className="mx-auto -mt-3 h-3 w-10 rounded-t-md bg-teal/50" aria-hidden />
      <motion.div
        aria-label={`${pct}% full`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-teal to-primary"
        initial={{ height: 0 }}
        animate={{ height: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="relative z-10 mt-auto pb-3 text-center text-lg font-bold text-foreground mix-blend-difference">{pct}%</div>
    </div>
  );
}
