import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pause, Play, Pencil, Trash2, Plus, Search, Pill } from "lucide-react";
import { motion } from "framer-motion";
import { useMedicines, useSaveMedicine, useDeleteMedicine, useLogs } from "@/hooks/use-app-data";
import { medicineOccurrences, nextUpcoming } from "@/lib/scheduling";
import type { Medicine } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MedicineForm } from "@/components/medicine-form";
import { EmptyState } from "@/components/empty-state";
import { ListSkeleton } from "@/components/skeletons";
import { format, startOfDay } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/medicines")({
  component: MedicinesPage,
});

function MedicinesPage() {
  const { data: medicines = [], isLoading } = useMedicines();
  const { data: logs = [] } = useLogs();
  const save = useSaveMedicine();
  const del = useDeleteMedicine();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [creating, setCreating] = useState(false);

  const dayStart = startOfDay(new Date()).getTime();
  const doneToday = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of logs) {
      if (l.status === "done" && (l.completedAt ?? 0) >= dayStart && l.refType === "medicine") {
        map.set(l.refId, (map.get(l.refId) ?? 0) + 1);
      }
    }
    return map;
  }, [logs, dayStart]);

  const filtered = useMemo(
    () =>
      medicines.filter(
        (m) =>
          m.name.toLowerCase().includes(q.toLowerCase()) ||
          m.dosage.toLowerCase().includes(q.toLowerCase()),
      ),
    [medicines, q],
  );

  return (
    <div className="space-y-4">
      <header className="flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Medicines</h1>
          <p className="text-sm text-muted-foreground">{medicines.length} in your library</p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search medicines"
          className="pl-9"
          aria-label="Search medicines"
        />
      </div>

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Pill}
          title={medicines.length === 0 ? "No medicines yet" : "No matches"}
          description={medicines.length === 0 ? "Tap Add to create your first schedule." : "Try a different search term."}
          action={medicines.length === 0 ? (
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-1 h-4 w-4" /> Add medicine
            </Button>
          ) : undefined}
        />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {filtered.map((m, i) => {
            const today = medicineOccurrences(m, new Date());
            const next = nextUpcoming(today);
            const done = doneToday.get(m.id) ?? 0;
            const remaining = Math.max(0, today.length - done);
            return (
              <motion.li
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.2) }}
              >
                <div className="card-elevated card-hover card-hover-on p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
                      style={{ backgroundColor: `${m.color}22`, border: `1px solid ${m.color}55` }}
                    >
                      <span className="text-sm font-semibold" style={{ color: m.color }}>
                        {m.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{m.name}</p>
                        {m.paused && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">Paused</span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {m.dosage || "—"} · {m.type} · {m.food}
                      </p>
                      <p className="mt-1 flex flex-wrap gap-x-2 text-xs">
                        <span>
                          <span className="text-muted-foreground">Next: </span>
                          <span className="font-medium tabular-nums">
                            {next ? format(next.at, "HH:mm") : "—"}
                          </span>
                        </span>
                        <span>
                          <span className="text-muted-foreground">Today: </span>
                          <span className="font-medium">{done}/{today.length}</span>
                          {remaining > 0 && (
                            <span className="text-muted-foreground"> · {remaining} left</span>
                          )}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-1 border-t border-border/60 pt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        save.mutate({ ...m, paused: !m.paused });
                        toast.success(m.paused ? "Resumed" : "Paused");
                      }}
                    >
                      {m.paused ? <Play className="mr-1 h-4 w-4" /> : <Pause className="mr-1 h-4 w-4" />}
                      {m.paused ? "Resume" : "Pause"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(m)}>
                      <Pencil className="mr-1 h-4 w-4" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Delete "${m.name}"?`)) {
                          del.mutate(m.id);
                          toast.success("Deleted");
                        }
                      }}
                      className="text-danger hover:text-danger"
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Delete
                    </Button>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}

      <Sheet
        open={creating || !!editing}
        onOpenChange={(v) => {
          if (!v) { setCreating(false); setEditing(null); }
        }}
      >
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit medicine" : "New medicine"}</SheetTitle>
          </SheetHeader>
          <MedicineForm
            initial={editing ?? undefined}
            onDone={() => { setCreating(false); setEditing(null); }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
