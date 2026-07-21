import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db, uid } from "@/lib/db";
import type {
  Medicine,
  CustomReminder,
  WaterEntry,
  ReminderLog,
  AppSettings,
} from "@/lib/types";

const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  notificationSound: true,
  vibration: true,
  water: {
    dailyGoal: 2500,
    intervalMinutes: 60,
    wakeTime: "07:00",
    sleepTime: "22:00",
  },
};

export function useMedicines() {
  return useQuery({ queryKey: ["medicines"], queryFn: () => db.listMedicines() });
}
export function useReminders() {
  return useQuery({ queryKey: ["reminders"], queryFn: () => db.listReminders() });
}
export function useWater() {
  return useQuery({ queryKey: ["water"], queryFn: () => db.listWater() });
}
export function useLogs() {
  return useQuery({ queryKey: ["logs"], queryFn: () => db.listLogs() });
}
export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await db.getSettings()) ?? DEFAULT_SETTINGS,
  });
}

export function useSaveMedicine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: Partial<Medicine> & { id?: string }) => {
      const full: Medicine = {
        id: m.id ?? uid(),
        name: m.name ?? "",
        dosage: m.dosage ?? "",
        type: m.type ?? "pill",
        food: m.food ?? "any",
        notes: m.notes,
        color: m.color ?? "#3b82f6",
        times: m.times ?? ["09:00"],
        repeat: m.repeat ?? "daily",
        repeatDays: m.repeatDays,
        repeatInterval: m.repeatInterval,
        startDate: m.startDate ?? new Date().toISOString().slice(0, 10),
        endDate: m.endDate,
        paused: m.paused ?? false,
        notification: m.notification ?? true,
        vibration: m.vibration ?? true,
        createdAt: m.createdAt ?? Date.now(),
      };
      await db.saveMedicine(full);
      return full;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medicines"] }),
  });
}

export function useDeleteMedicine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.deleteMedicine(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medicines"] }),
  });
}

export function useSaveReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: Partial<CustomReminder> & { id?: string }) => {
      const full: CustomReminder = {
        id: r.id ?? uid(),
        title: r.title ?? "",
        description: r.description,
        category: r.category ?? "General",
        icon: r.icon ?? "bell",
        color: r.color ?? "#0ea5e9",
        priority: r.priority ?? "medium",
        time: r.time ?? "09:00",
        repeat: r.repeat ?? "daily",
        repeatDays: r.repeatDays,
        repeatInterval: r.repeatInterval,
        notification: r.notification ?? true,
        snoozeMinutes: r.snoozeMinutes ?? 10,
        paused: r.paused ?? false,
        createdAt: r.createdAt ?? Date.now(),
      };
      await db.saveReminder(full);
      return full;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });
}
export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.deleteReminder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });
}

export function useAddWater() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      const entry: WaterEntry = { id: uid(), amount, timestamp: Date.now() };
      await db.saveWater(entry);
      return entry;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["water"] }),
  });
}
export function useDeleteWater() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.deleteWater(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["water"] }),
  });
}

export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (s: AppSettings) => db.saveSettings(s),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function useLogReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (l: Omit<ReminderLog, "id">) => {
      const full: ReminderLog = { ...l, id: uid() };
      await db.saveLog(full);
      return full;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["logs"] }),
  });
}
