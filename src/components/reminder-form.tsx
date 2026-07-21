import { useState } from "react";
import { useSaveReminder } from "@/hooks/use-app-data";
import type { CustomReminder, Priority, RepeatType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const COLORS = ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const CATEGORIES = ["Exercise", "Study", "Meeting", "Prayer", "Meditation", "Bills", "Birthday", "Refill", "General"];
const PRIORITIES: Priority[] = ["low", "medium", "high"];
const REPEATS: RepeatType[] = ["daily", "weekdays", "weekends", "specific", "everyX"];
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function ReminderForm({ initial, onDone }: { initial?: CustomReminder; onDone: () => void }) {
  const save = useSaveReminder();
  const [r, setR] = useState<Partial<CustomReminder>>(
    initial ?? {
      title: "", category: "General", icon: "bell", color: COLORS[0], priority: "medium",
      time: "09:00", repeat: "daily", notification: true, snoozeMinutes: 10, paused: false,
    }
  );
  const set = <K extends keyof CustomReminder>(k: K, v: CustomReminder[K]) => setR((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!r.title?.trim()) { toast.error("Title is required"); return; }
    await save.mutateAsync(r);
    toast.success(initial ? "Reminder updated" : "Reminder added");
    onDone();
  };

  return (
    <div className="mt-4 space-y-4">
      <Field label="Title">
        <Input value={r.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Morning walk" />
      </Field>
      <Field label="Description">
        <Textarea value={r.description ?? ""} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <Select value={r.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={r.priority} onValueChange={(v) => set("priority", v as Priority)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Color">
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button key={c} type="button" aria-label={`Color ${c}`}
              onClick={() => set("color", c)}
              className="h-9 w-9 rounded-full border-2 transition-transform hover:scale-110"
              style={{ backgroundColor: c, borderColor: r.color === c ? "var(--color-foreground)" : "transparent" }}
            />
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Time">
          <Input type="time" value={r.time ?? "09:00"} onChange={(e) => set("time", e.target.value)} />
        </Field>
        <Field label="Snooze (min)">
          <Input type="number" min={1} value={r.snoozeMinutes ?? 10} onChange={(e) => set("snoozeMinutes", Number(e.target.value))} />
        </Field>
      </div>
      <Field label="Repeat">
        <Select value={r.repeat} onValueChange={(v) => set("repeat", v as RepeatType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {REPEATS.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      {r.repeat === "specific" && (
        <Field label="Days">
          <div className="flex gap-1">
            {DAYS.map((d, i) => {
              const sel = r.repeatDays?.includes(i);
              return (
                <button key={i} type="button"
                  onClick={() => {
                    const cur = r.repeatDays ?? [];
                    set("repeatDays", sel ? cur.filter((x) => x !== i) : [...cur, i]);
                  }}
                  className={`h-9 w-9 rounded-full text-xs font-semibold ${sel ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >{d}</button>
              );
            })}
          </div>
        </Field>
      )}
      {r.repeat === "everyX" && (
        <Field label="Every X days">
          <Input type="number" min={1} value={r.repeatInterval ?? 2} onChange={(e) => set("repeatInterval", Number(e.target.value))} />
        </Field>
      )}
      <div className="space-y-2 rounded-2xl border border-border bg-card/50 p-3">
        <div className="flex items-center justify-between py-1">
          <span className="text-sm">Notification</span>
          <Switch checked={!!r.notification} onCheckedChange={(v) => set("notification", v)} />
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-sm">Pause reminder</span>
          <Switch checked={!!r.paused} onCheckedChange={(v) => set("paused", v)} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onDone}>Cancel</Button>
        <Button onClick={submit} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
