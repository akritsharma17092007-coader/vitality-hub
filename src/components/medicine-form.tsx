import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const schema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(80),
    dosage: z.string().trim().max(60).optional().default(""),
    type: z.enum(["pill", "capsule", "tablet", "syrup", "injection", "drops", "inhaler", "other"]),
    food: z.enum(["before", "after", "with", "any"]),
    color: z.string(),
    times: z.array(z.string().regex(/^\d{2}:\d{2}$/, "Invalid time")).min(1, "Add at least one time"),
    repeat: z.enum(["daily", "weekdays", "weekends", "specific", "everyX"]),
    repeatDays: z.array(z.number().int().min(0).max(6)).optional(),
    repeatInterval: z.number().int().min(1).max(60).optional(),
    startDate: z.string().min(1, "Start date required"),
    endDate: z.string().optional().or(z.literal("")),
    notes: z.string().max(500).optional().or(z.literal("")),
    paused: z.boolean(),
    notification: z.boolean(),
    vibration: z.boolean(),
  })
  .refine((v) => v.repeat !== "specific" || (v.repeatDays && v.repeatDays.length > 0), {
    path: ["repeatDays"], message: "Pick at least one day",
  })
  .refine((v) => v.repeat !== "everyX" || (v.repeatInterval ?? 0) >= 1, {
    path: ["repeatInterval"], message: "Interval must be ≥ 1",
  });

type FormValues = z.infer<typeof schema>;

export function MedicineForm({ initial, onDone }: { initial?: Medicine; onDone: () => void }) {
  const save = useSaveMedicine();

  const defaults: FormValues = {
    name: initial?.name ?? "",
    dosage: initial?.dosage ?? "",
    type: initial?.type ?? "pill",
    food: initial?.food ?? "any",
    color: initial?.color ?? COLORS[0],
    times: initial?.times ?? ["09:00"],
    repeat: (initial?.repeat as FormValues["repeat"]) ?? "daily",
    repeatDays: initial?.repeatDays,
    repeatInterval: initial?.repeatInterval,
    startDate: initial?.startDate ?? new Date().toISOString().slice(0, 10),
    endDate: initial?.endDate ?? "",
    notes: initial?.notes ?? "",
    paused: initial?.paused ?? false,
    notification: initial?.notification ?? true,
    vibration: initial?.vibration ?? true,
  };

  const {
    control, register, handleSubmit, watch, setValue, formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults });

  const repeat = watch("repeat");
  const times = watch("times");
  const color = watch("color");
  const repeatDays = watch("repeatDays") ?? [];

  const addTime = () => setValue("times", [...times, "12:00"], { shouldValidate: true });
  const rmTime = (i: number) =>
    setValue("times", times.filter((_, x) => x !== i), { shouldValidate: true });
  const setTime = (i: number, v: string) =>
    setValue("times", times.map((t, x) => (x === i ? v : t)), { shouldValidate: true });

  const submit = handleSubmit(async (v) => {
    await save.mutateAsync({
      ...(initial ?? {}),
      ...v,
      endDate: v.endDate || undefined,
      notes: v.notes || undefined,
    });
    toast.success(initial ? "Medicine updated" : "Medicine added");
    onDone();
  });

  return (
    <form onSubmit={submit} className="mt-4 space-y-4">
      <Field label="Name" error={errors.name?.message}>
        <Input {...register("name")} placeholder="e.g. Paracetamol" />
      </Field>
      <Field label="Dosage">
        <Input {...register("dosage")} placeholder="e.g. 500 mg" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <Controller control={control} name="type" render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MED_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </Field>
        <Field label="Food">
          <Controller control={control} name="food" render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FOOD.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </Field>
      </div>

      <Field label="Color">
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button key={c} type="button" aria-label={`Color ${c}`}
              onClick={() => setValue("color", c)}
              className="h-10 w-10 rounded-full border-2 transition-transform hover:scale-110 active:scale-95"
              style={{ backgroundColor: c, borderColor: color === c ? "var(--color-foreground)" : "transparent" }}
            />
          ))}
        </div>
      </Field>

      <Field label="Times" error={errors.times?.message as string | undefined}>
        <div className="space-y-2">
          {times.map((t, i) => (
            <div key={i} className="flex gap-2">
              <Input type="time" value={t} onChange={(e) => setTime(i, e.target.value)} />
              <Button type="button" variant="ghost" size="icon" onClick={() => rmTime(i)} aria-label="Remove time"
                disabled={times.length === 1}>
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
        <Controller control={control} name="repeat" render={({ field }) => (
          <Select value={field.value} onValueChange={(v) => field.onChange(v as RepeatType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {REPEATS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
      </Field>

      {repeat === "specific" && (
        <Field label="Days" error={errors.repeatDays?.message as string | undefined}>
          <div className="flex flex-wrap gap-1">
            {DAYS.map((d, i) => {
              const sel = repeatDays.includes(i);
              return (
                <button key={i} type="button"
                  onClick={() => setValue(
                    "repeatDays",
                    sel ? repeatDays.filter((x) => x !== i) : [...repeatDays, i],
                    { shouldValidate: true },
                  )}
                  className={`tap-target rounded-full text-xs font-semibold ${sel ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >{d}</button>
              );
            })}
          </div>
        </Field>
      )}

      {repeat === "everyX" && (
        <Field label="Every X days" error={errors.repeatInterval?.message}>
          <Input type="number" min={1}
            {...register("repeatInterval", { valueAsNumber: true })}
          />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date" error={errors.startDate?.message}>
          <Input type="date" {...register("startDate")} />
        </Field>
        <Field label="End date">
          <Input type="date" {...register("endDate")} />
        </Field>
      </div>

      <Field label="Notes">
        <Textarea rows={2} {...register("notes")} placeholder="Optional notes" />
      </Field>

      <div className="space-y-2 rounded-2xl border border-border bg-card/50 p-3">
        <ToggleRow label="Notification" name="notification" control={control} />
        <ToggleRow label="Vibration" name="vibration" control={control} />
        <ToggleRow label="Pause reminder" name="paused" control={control} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting || save.isPending}>
          {save.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

function ToggleRow({
  label, name, control,
}: {
  label: string;
  name: "notification" | "vibration" | "paused";
  control: ReturnType<typeof useForm<FormValues>>["control"];
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm">{label}</span>
      <Controller control={control} name={name} render={({ field }) => (
        <Switch checked={field.value} onCheckedChange={field.onChange} />
      )} />
    </div>
  );
}
