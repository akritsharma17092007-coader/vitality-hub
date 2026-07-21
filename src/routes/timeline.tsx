import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";
import { useMedicines, useReminders, useLogs } from "@/hooks/use-app-data";
import { buildTodayTimeline } from "@/lib/scheduling";
import { TimelineList } from "@/components/timeline-list";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addDays, format, startOfDay } from "date-fns";

export const Route = createFileRoute("/timeline")({
  component: TimelinePage,
});

type Filter =
  | "today"
  | "upcoming"
  | "tomorrow"
  | "completed"
  | "missed"
  | "medicine"
  | "custom";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "completed", label: "Completed" },
  { key: "missed", label: "Missed" },
  { key: "medicine", label: "Medicine" },
  { key: "custom", label: "Custom" },
];

function TimelinePage() {
  const { data: medicines = [] } = useMedicines();
  const { data: reminders = [] } = useReminders();
  const { data: logs = [] } = useLogs();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("today");

  const now = new Date();
  const dayStart = startOfDay(now).getTime();

  const completedKeys = useMemo(() => {
    const s = new Set<string>();
    for (const l of logs) {
      if (l.status === "done" && (l.completedAt ?? 0) >= dayStart) {
        s.add(`${l.refId}-${format(l.scheduledFor, "HH:mm")}`);
      }
    }
    return s;
  }, [logs, dayStart]);

  const missedKeys = useMemo(() => {
    const s = new Set<string>();
    for (const l of logs) {
      if (l.status === "skipped" && (l.completedAt ?? l.scheduledFor) >= dayStart) {
        s.add(`${l.refId}-${format(l.scheduledFor, "HH:mm")}`);
      }
    }
    return s;
  }, [logs, dayStart]);

  const items = useMemo(() => {
    const date = filter === "tomorrow" ? addDays(now, 1) : now;
    let all = buildTodayTimeline(medicines, reminders, date);

    switch (filter) {
      case "upcoming":
        all = all.filter((i) => i.at.getTime() >= now.getTime());
        break;
      case "completed":
        all = all.filter((i) => completedKeys.has(`${i.refId}-${i.time}`));
        break;
      case "missed":
        all = all.filter((i) => missedKeys.has(`${i.refId}-${i.time}`));
        break;
      case "medicine":
        all = all.filter((i) => i.refType === "medicine");
        break;
      case "custom":
        all = all.filter((i) => i.refType === "custom");
        break;
    }
    if (q.trim()) {
      const s = q.toLowerCase();
      all = all.filter(
        (i) => i.title.toLowerCase().includes(s) || i.category.toLowerCase().includes(s),
      );
    }
    return all;
  }, [medicines, reminders, filter, q, completedKeys, missedKeys, now]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Timeline</h1>
        <p className="text-sm text-muted-foreground">All your reminders in one place</p>
      </header>

      <div className="sticky top-0 z-10 -mx-4 space-y-2 bg-background/80 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search titles or categories"
            className="pl-9"
            aria-label="Search reminders"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          <Filter className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "default" : "outline"}
              className="shrink-0 rounded-full"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <TimelineList items={items} showActions completedIds={completedKeys} />
    </div>
  );
}
