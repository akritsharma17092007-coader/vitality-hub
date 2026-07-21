import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Plus, Pill, Droplet, CheckCircle2, Clock, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useMedicines, useReminders, useWater, useLogs, useSettings } from "@/hooks/use-app-data";
import { buildTodayTimeline, nextUpcoming } from "@/lib/scheduling";
import { ProgressRing } from "@/components/progress-ring";
import { TimelineList } from "@/components/timeline-list";
import { Button } from "@/components/ui/button";
import { AddSheet } from "@/components/add-sheet";
import { useNow } from "@/hooks/use-now";

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
  const now = useNow(30_000);
  const [openAdd, setOpenAdd] = useState<{ open: boolean; tab?: "medicine" | "reminder" | "water" }>({ open: false });
  const { data: medicines = [] } = useMedicines();
  const { data: reminders = [] } = useReminders();
  const { data: water = [] } = useWater();
  const { data: logs = [] } = useLogs();
  const { data: settings } = useSettings();

  const timeline = useMemo(() => buildTodayTimeline(medicines, reminders, now), [medicines, reminders, now]);
  const upcoming = nextUpcoming(timeline, now);

  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const todayWater = water.filter((w) => w.timestamp >= startOfToday.getTime()).reduce((s, w) => s + w.amount, 0);
  const goal = settings?.water.dailyGoal ?? 2500;

  const doneToday = logs.filter((l) => l.status === "done" && (l.completedAt ?? 0) >= startOfToday.getTime()).length;
  const medsToday = timeline.filter((t) => t.refType === "medicine").length;
  const dayProgress = timeline.length === 0 ? 0 : Math.min(1, doneToday / timeline.length);

  const completedKeys = useMemo(() => {
    const s = new Set<string>();
    for (const l of logs) {
      if (l.status === "done" && (l.completedAt ?? 0) >= startOfToday.getTime()) {
        s.add(`${l.refId}-${format(l.scheduledFor, "HH:mm")}`);
      }
    }
    return s;
  }, [logs, startOfToday]);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            {format(now, "EEEE, d MMMM")} · <span className="tabular-nums">{format(now, "HH:mm")}</span>
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{greet(now)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's your day at a glance.</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard icon={<Pill className="h-4 w-4" />} tint="primary" label="Medicines" value={String(medsToday)} sub="scheduled" />
        <SummaryCard icon={<Droplet className="h-4 w-4" />} tint="teal" label="Water"
          value={`${(todayWater / 1000).toFixed(1)}L`} sub={`of ${(goal / 1000).toFixed(1)}L`} />
        <SummaryCard icon={<Clock className="h-4 w-4" />} tint="warning" label="Next"
          value={upcoming ? upcoming.time : "—"} sub={upcoming?.title} />
        <SummaryCard icon={<CheckCircle2 className="h-4 w-4" />} tint="success" label="Done"
          value={String(doneToday)} sub={`of ${timeline.length}`} />
      </section>

      <section className="card-elevated relative overflow-hidden p-6">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-teal/10 blur-3xl" />
        <div className="relative flex flex-col items-center gap-3">
          <ProgressRing value={dayProgress} label={`${Math.round(dayProgress * 100)}%`} sub="Daily progress" />
          <p className="text-center text-sm text-muted-foreground">
            {doneToday} of {timeline.length} reminders completed
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Quick actions</h2>
        <div className="grid grid-cols-3 gap-2">
          <QuickAction icon={<Pill />} label="Medicine" onClick={() => setOpenAdd({ open: true, tab: "medicine" })} />
          <QuickAction icon={<Droplet />} label="Water" onClick={() => setOpenAdd({ open: true, tab: "water" })} />
          <QuickAction icon={<Bell />} label="Reminder" onClick={() => setOpenAdd({ open: true, tab: "reminder" })} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Today's timeline</h2>
          <span className="text-xs text-muted-foreground">{timeline.length} items</span>
        </div>
        <TimelineList items={timeline} completedIds={completedKeys} />
      </section>

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 24 }}
        className="fixed right-4 z-30 sm:right-8"
        style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        <Button
          size="lg"
          aria-label="Create new reminder"
          onClick={() => setOpenAdd({ open: true })}
          className="h-14 w-14 rounded-full p-0"
          style={{ boxShadow: "var(--shadow-float)" }}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>

      <AddSheet
        open={openAdd.open}
        onOpenChange={(open) => setOpenAdd({ open })}
        initialTab={openAdd.tab}
      />
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
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="card-elevated card-hover card-hover-on p-4"
    >
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${tints[tint]}`}>{icon}</div>
      <div className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</div>}
    </motion.div>
  );
}

function QuickAction({
  icon, label, onClick,
}: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="card-elevated card-hover card-hover-on flex flex-col items-center gap-1.5 py-4 text-sm font-medium transition-transform active:scale-95"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}
