import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Plus, Pill, Droplet, CheckCircle2, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useMedicines, useReminders, useWater, useLogs, useSettings } from "@/hooks/use-app-data";
import { buildTodayTimeline, nextUpcoming } from "@/lib/scheduling";
import { ProgressRing } from "@/components/progress-ring";
import { TimelineList } from "@/components/timeline-list";
import { Button } from "@/components/ui/button";
import { AddSheet } from "@/components/add-sheet";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function greet(date: Date) {
  const h = date.getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function HomePage() {
  const now = new Date();
  const [openAdd, setOpenAdd] = useState(false);
  const { data: medicines = [] } = useMedicines();
  const { data: reminders = [] } = useReminders();
  const { data: water = [] } = useWater();
  const { data: logs = [] } = useLogs();
  const { data: settings } = useSettings();

  const timeline = useMemo(() => buildTodayTimeline(medicines, reminders, now), [medicines, reminders]);
  const upcoming = nextUpcoming(timeline, now);

  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const todayWater = water.filter((w) => w.timestamp >= startOfToday.getTime()).reduce((s, w) => s + w.amount, 0);
  const goal = settings?.water.dailyGoal ?? 2500;

  const doneToday = logs.filter((l) => l.status === "done" && (l.completedAt ?? 0) >= startOfToday.getTime()).length;
  const medsToday = timeline.filter((t) => t.refType === "medicine").length;

  const dayProgress = timeline.length === 0 ? 0 : doneToday / timeline.length;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-muted-foreground">{format(now, "EEEE, d MMMM")}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{greet(now)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here's your day at a glance.</p>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <SummaryCard icon={<Pill className="h-4 w-4" />} tint="primary" label="Medicines today" value={String(medsToday)} />
        <SummaryCard icon={<Droplet className="h-4 w-4" />} tint="teal" label="Water" value={`${(todayWater / 1000).toFixed(1)}L`} sub={`of ${(goal / 1000).toFixed(1)}L`} />
        <SummaryCard icon={<Clock className="h-4 w-4" />} tint="warning" label="Next reminder" value={upcoming ? upcoming.time : "—"} sub={upcoming?.title} />
        <SummaryCard icon={<CheckCircle2 className="h-4 w-4" />} tint="success" label="Completed" value={String(doneToday)} sub={`of ${timeline.length}`} />
      </section>

      <section className="card-elevated flex flex-col items-center gap-2 p-6">
        <ProgressRing
          value={dayProgress}
          label={`${Math.round(dayProgress * 100)}%`}
          sub="Daily progress"
        />
        <p className="text-center text-sm text-muted-foreground">
          {doneToday} of {timeline.length} reminders completed
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Today's timeline</h2>
          <span className="text-xs text-muted-foreground">{timeline.length} items</span>
        </div>
        <TimelineList items={timeline} />
      </section>

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 24 }}
        className="fixed bottom-24 right-4 z-30"
        style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        <Button
          size="lg"
          aria-label="Create new reminder"
          onClick={() => setOpenAdd(true)}
          className="h-14 w-14 rounded-full p-0 shadow-lg shadow-primary/30"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>

      <AddSheet open={openAdd} onOpenChange={setOpenAdd} />
    </div>
  );
}

function SummaryCard({
  icon, label, value, sub, tint = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tint?: "primary" | "teal" | "success" | "warning" | "danger";
}) {
  const tints: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    teal: "bg-teal/15 text-teal",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/15 text-danger",
  };
  return (
    <div className="card-elevated p-4">
      <div className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${tints[tint]}`}>{icon}</div>
      <div className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
