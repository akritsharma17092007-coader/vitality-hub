import { useState } from "react";
import { useSaveMedicine } from "@/hooks/use-app-data";
import type { Medicine, MedicineType, FoodTiming, RepeatType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const MED_TYPES: MedicineType[] = ["pill", "capsule", "tablet", "syrup", "injection", "drops", "inhaler", "other"];
const FOOD: FoodTiming[] = ["before", "after", "with", "any"];
const REPEATS: RepeatType[] = ["daily", "weekdays", "weekends", "specific", "everyX"];
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function MedicineForm({ initial, onDone }: { initial?: Medicine; onDone: () => void }) {
  const save = useSaveMedicine();
  const [m, setM] = useState<Partial<Medicine>>(
    initial ?? {
      name: "", dosage: "", type: "pill", food: "any", color: COLORS[0],
      times: ["09:00"], repeat: "daily", startDate: new Date().toISOString().slice(0, 10),
      paused: false, notification: true, vibration: true,
    }
  );
  const set = <K extends keyof Medicine>(k: K, v: Medicine[K]) => setM((p) => ({ ...p, [k]: v }));

  const addTime = () => set("times", [...(m.times ?? []), "12:00"]);
  const rmTime = (i: number) => set("times", (m.times ?? []).filter((_, x) => x !== i));
  const setTime = (i: number, v: string) => set("times", (m.times ?? []).map((t, x) => (x === i ? v : t)));

  const submit = async () => {
    if (!m.name?.trim()) { toast.error("Name is required"); return; }
    await save.mutateAsync(m);
    toast.success(initial ? "Medicine updated" : "Medicine added");
    onDone();
  };

  return (
    <div className="mt-4 space-y-4">
      <Field label="Name">
        <Input value={m.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Paracetamol" />
      </Field>
      <Field label="Dosage">
        <Input value={m.dosage ?? ""} onChange={(e) => set("dosage", e.target.value)} placeholder="e.g. 500 mg" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <Select value={m.type} onValueChange={(v) => set("type", v as MedicineType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MED_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Food">
          <Select value={m.food} onValueChange={(v) => set("food", v as FoodTiming)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FOOD.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
              style={{ backgroundColor: c, borderColor: m.color === c ? "var(--color-foreground)" : "transparent" }}
            />
          ))}
        </div>
      </Field>

      <Field label="Times">
        <div className="space-y-2">
          {(m.times ?? []).map((t, i) => (
            <div key={i} className="flex gap-2">
              <Input type="time" value={t} onChange={(e) => setTime(i, e.target.value)} />
              <Button type="button" variant="ghost" size="icon" onClick={() => rmTime(i)} aria-label="Remove time">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addTime}>
            <Plus className="mr-2 h-4 w-4" /> Add time
          </Button>
        </div>
      </Field>

      <Field label="Repeat">
        <Select value={m.repeat} onValueChange={(v) => set("repeat", v as RepeatType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {REPEATS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      {m.repeat === "specific" && (
        <Field label="Days">
          <div className="flex gap-1">
            {DAYS.map((d, i) => {
              const sel = m.repeatDays?.includes(i);
              return (
                <button key={i} type="button"
                  onClick={() => {
                    const cur = m.repeatDays ?? [];
                    set("repeatDays", sel ? cur.filter((x) => x !== i) : [...cur, i]);
                  }}
                  className={`h-9 w-9 rounded-full text-xs font-semibold ${sel ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >{d}</button>
              );
            })}
          </div>
        </Field>
      )}

      {m.repeat === "everyX" && (
        <Field label="Every X days">
          <Input type="number" min={1} value={m.repeatInterval ?? 2}
            onChange={(e) => set("repeatInterval", Number(e.target.value))} />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date">
          <Input type="date" value={m.startDate ?? ""} onChange={(e) => set("startDate", e.target.value)} />
        </Field>
        <Field label="End date">
          <Input type="date" value={m.endDate ?? ""} onChange={(e) => set("endDate", e.target.value)} />
        </Field>
      </div>

      <Field label="Notes">
        <Textarea value={m.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="Optional notes" />
      </Field>

      <div className="space-y-2 rounded-2xl border border-border bg-card/50 p-3">
        <ToggleRow label="Notification" checked={!!m.notification} onChange={(v) => set("notification", v)} />
        <ToggleRow label="Vibration" checked={!!m.vibration} onChange={(v) => set("vibration", v)} />
        <ToggleRow label="Pause reminder" checked={!!m.paused} onChange={(v) => set("paused", v)} />
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
function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
