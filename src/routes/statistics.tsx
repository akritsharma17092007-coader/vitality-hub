import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { format, startOfDay, subDays } from "date-fns";
import { useLogs, useWater, useMedicines, useReminders, useSettings } from "@/hooks/use-app-data";
import { buildTodayTimeline } from "@/lib/scheduling";
import { ProgressRing } from "@/components/progress-ring";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/statistics")({
  component: StatisticsPage,
});

type Period = 7 | 30 | 90;

function StatisticsPage() {
  const { data: logs = [] } = useLogs();
  const { data: water = [] } = useWater();
  const { data: medicines = [] } = useMedicines();
  const { data: reminders = [] } = useReminders();
  const { data: settings } = useSettings();
  const [period, setPeriod] = useState<Period>(7);

  const goal = settings?.water.dailyGoal ?? 2500;
  const todayStart = startOfDay(new Date()).getTime();
  const todayWater = water.filter((w) => w.timestamp >= todayStart).reduce((s, w) => s + w.amount, 0);

  const timeline = buildTodayTimeline(medicines, reminders, new Date());
  const done = logs.filter((l) => l.status === "done" && (l.completedAt ?? 0) >= todayStart).length;
  const missed = logs.filter((l) => l.status === "skipped" && (l.completedAt ?? l.scheduledFor) >= todayStart).length;
  const compliance = timeline.length ? Math.round((done / timeline.length) * 100) : 0;

  const chartData = useMemo(() => {
    return Array.from({ length: period }).map((_, i) => {
      const d = subDays(new Date(), period - 1 - i);
      const s = startOfDay(d).getTime();
      const e = s + 86400000;
      const dDone = logs.filter((l) => l.status === "done" && (l.completedAt ?? 0) >= s && (l.completedAt ?? 0) < e).length;
      const dWater = water.filter((w) => w.timestamp >= s && w.timestamp < e).reduce((sum, w) => sum + w.amount, 0);
      return {
        day: period <= 7 ? format(d, "EEE") : format(d, "d/M"),
        done: dDone,
        water: Math.round(dWater / 100) / 10,
      };
    });
  }, [logs, water, period]);

  const streak = useMemo(() => {
    let s = 0;
    for (let i = 0; i < 365; i++) {
      const day = subDays(new Date(), i);
      const st = startOfDay(day).getTime();
      const et = st + 86400000;
      const anyDone = logs.some((l) => l.status === "done" && (l.completedAt ?? 0) >= st && (l.completedAt ?? 0) < et);
      if (anyDone) s++;
      else if (i === 0) break;
      else break;
    }
    return s;
  }, [logs]);

  const pieData = [
    { name: "Done", value: logs.filter((l) => l.status === "done").length, color: "var(--color-success)" },
    { name: "Skipped", value: logs.filter((l) => l.status === "skipped").length, color: "var(--color-danger)" },
    { name: "Snoozed", value: logs.filter((l) => l.status === "snoozed").length, color: "var(--color-warning)" },
  ].filter((d) => d.value > 0);

  const periods: { key: Period; label: string }[] = [
    { key: 7, label: "7d" }, { key: 30, label: "30d" }, { key: 90, label: "90d" },
  ];

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Statistics</h1>
          <p className="text-sm text-muted-foreground">Your progress at a glance</p>
        </div>
        <div className="flex gap-1 rounded-full border border-border bg-card p-1">
          {periods.map((p) => (
            <Button
              key={p.key}
              size="sm"
              variant={period === p.key ? "default" : "ghost"}
              className="h-8 rounded-full px-3 text-xs"
              onClick={() => setPeriod(p.key)}
              aria-pressed={period === p.key}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="card-elevated flex flex-col items-center gap-2 p-4">
          <ProgressRing value={compliance / 100} size={110} stroke={9} label={`${compliance}%`} sub="Today" />
          <p className="text-xs font-medium text-muted-foreground">Compliance</p>
        </div>
        <div className="card-elevated flex flex-col items-center gap-2 p-4">
          <ProgressRing
            value={Math.min(1, todayWater / goal)}
            size={110}
            stroke={9}
            color="var(--color-teal)"
            label={`${Math.round((todayWater / goal) * 100)}%`}
            sub="Water"
          />
          <p className="text-xs font-medium text-muted-foreground">Daily goal</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Streak" value={`${streak}d`} tint="text-success" />
        <Stat label="Completed" value={String(done)} tint="text-primary" />
        <Stat label="Missed" value={String(missed)} tint="text-danger" />
      </div>

      <section className="card-elevated p-4">
        <h2 className="mb-3 text-sm font-semibold">Completed reminders</h2>
        <div className="h-44">
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={20} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
              <Bar dataKey="done" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card-elevated p-4">
        <h2 className="mb-3 text-sm font-semibold">Water intake (L)</h2>
        <div className="h-44">
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={20} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
              <Bar dataKey="water" fill="var(--color-teal)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {pieData.length > 0 && (
        <section className="card-elevated p-4">
          <h2 className="mb-3 text-sm font-semibold">Reminder outcomes</h2>
          <div className="h-52">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={4}>
                  {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
            {pieData.map((d) => (
              <span key={d.name} className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                {d.name}: {d.value}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <div className="card-elevated p-3 text-center">
      <div className={`text-2xl font-semibold tabular-nums ${tint}`}>{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
