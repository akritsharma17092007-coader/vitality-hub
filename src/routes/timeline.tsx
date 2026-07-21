import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useMedicines, useReminders } from "@/hooks/use-app-data";
import { buildTodayTimeline } from "@/lib/scheduling";
import { TimelineList } from "@/components/timeline-list";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addDays } from "date-fns";

export const Route = createFileRoute("/timeline")({
  component: TimelinePage,
});

type Filter = "today" | "tomorrow" | "medicine" | "custom";

function TimelinePage() {
  const { data: medicines = [] } = useMedicines();
  const { data: reminders = [] } = useReminders();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("today");

  const items = useMemo(() => {
    const date = filter === "tomorrow" ? addDays(new Date(), 1) : new Date();
    let all = buildTodayTimeline(medicines, reminders, date);
    if (filter === "medicine") all = all.filter((i) => i.refType === "medicine");
    if (filter === "custom") all = all.filter((i) => i.refType === "custom");
    if (q.trim()) {
      const s = q.toLowerCase();
      all = all.filter((i) => i.title.toLowerCase().includes(s) || i.category.toLowerCase().includes(s));
    }
    return all;
  }, [medicines, reminders, filter, q]);

  const filters: { key: Filter; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "tomorrow", label: "Tomorrow" },
    { key: "medicine", label: "Medicine" },
    { key: "custom", label: "Custom" },
  ];

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Timeline</h1>
        <p className="text-sm text-muted-foreground">All your reminders in one place</p>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles or categories" className="pl-9" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <TimelineList items={items} showActions />
    </div>
  );
}
