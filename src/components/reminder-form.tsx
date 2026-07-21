import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const schema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(80),
    description: z.string().max(300).optional().or(z.literal("")),
    category: z.string().min(1),
    color: z.string(),
    priority: z.enum(["low", "medium", "high"]),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time"),
    repeat: z.enum(["daily", "weekdays", "weekends", "specific", "everyX"]),
    repeatDays: z.array(z.number().int().min(0).max(6)).optional(),
    repeatInterval: z.number().int().min(1).max(60).optional(),
    snoozeMinutes: z.number().int().min(1).max(240),
    notification: z.boolean(),
    paused: z.boolean(),
  })
  .refine((v) => v.repeat !== "specific" || (v.repeatDays && v.repeatDays.length > 0), {
    path: ["repeatDays"], message: "Pick at least one day",
  });

type FormValues = z.infer<typeof schema>;

export function ReminderForm({ initial, onDone }: { initial?: CustomReminder; onDone: () => void }) {
  const save = useSaveReminder();
  const defaults: FormValues = {
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? "General",
    color: initial?.color ?? COLORS[0],
    priority: initial?.priority ?? "medium",
    time: initial?.time ?? "09:00",
    repeat: (initial?.repeat as FormValues["repeat"]) ?? "daily",
    repeatDays: initial?.repeatDays,
    repeatInterval: initial?.repeatInterval,
    snoozeMinutes: initial?.snoozeMinutes ?? 10,
    notification: initial?.notification ?? true,
    paused: initial?.paused ?? false,
  };

  const {
    control, register, handleSubmit, watch, setValue, formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults });

  const repeat = watch("repeat");
  const color = watch("color");
  const repeatDays = watch("repeatDays") ?? [];

  const submit = handleSubmit(async (v) => {
    await save.mutateAsync({
      ...(initial ?? {}),
      ...v,
      icon: initial?.icon ?? "bell",
      description: v.description || undefined,
    });
    toast.success(initial ? "Reminder updated" : "Reminder added");
    onDone();
  });

  return (
    <form onSubmit={submit} className="mt-4 space-y-4">
      <Field label="Title" error={errors.title?.message}>
        <Input {...register("title")} placeholder="e.g. Morning walk" />
      </Field>
      <Field label="Description">
        <Textarea rows={2} {...register("description")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <Controller control={control} name="category" render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </Field>
        <Field label="Priority">
          <Controller control={control} name="priority" render={({ field }) => (
            <Select value={field.value} onValueChange={(v) => field.onChange(v as Priority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
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
      <div className="grid grid-cols-2 gap-3">
        <Field label="Time" error={errors.time?.message}>
          <Input type="time" {...register("time")} />
        </Field>
        <Field label="Snooze (min)" error={errors.snoozeMinutes?.message}>
          <Input type="number" min={1} {...register("snoozeMinutes", { valueAsNumber: true })} />
        </Field>
      </div>
      <Field label="Repeat">
        <Controller control={control} name="repeat" render={({ field }) => (
          <Select value={field.value} onValueChange={(v) => field.onChange(v as RepeatType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {REPEATS.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
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
        <Field label="Every X days">
          <Input type="number" min={1} {...register("repeatInterval", { valueAsNumber: true })} />
        </Field>
      )}
      <div className="space-y-2 rounded-2xl border border-border bg-card/50 p-3">
        <div className="flex items-center justify-between py-1">
          <span className="text-sm">Notification</span>
          <Controller control={control} name="notification" render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          )} />
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-sm">Pause reminder</span>
          <Controller control={control} name="paused" render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          )} />
        </div>
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
