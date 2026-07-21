export type MedicineType = "pill" | "capsule" | "tablet" | "syrup" | "injection" | "drops" | "inhaler" | "other";
export type FoodTiming = "before" | "after" | "with" | "any";
export type RepeatType = "daily" | "weekdays" | "weekends" | "specific" | "everyX" | "custom";
export type ReminderStatus = "pending" | "done" | "skipped" | "missed" | "snoozed";
export type Priority = "low" | "medium" | "high";

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  type: MedicineType;
  food: FoodTiming;
  notes?: string;
  color: string;
  times: string[]; // "HH:mm"
  repeat: RepeatType;
  repeatDays?: number[]; // 0-6 for specific
  repeatInterval?: number; // for everyX
  startDate: string; // ISO date
  endDate?: string;
  paused: boolean;
  notification: boolean;
  vibration: boolean;
  createdAt: number;
}

export interface CustomReminder {
  id: string;
  title: string;
  description?: string;
  category: string;
  icon: string;
  color: string;
  priority: Priority;
  time: string; // HH:mm
  repeat: RepeatType;
  repeatDays?: number[];
  repeatInterval?: number;
  notification: boolean;
  snoozeMinutes: number;
  paused: boolean;
  createdAt: number;
}

export interface WaterEntry {
  id: string;
  amount: number; // ml
  timestamp: number;
}

export interface WaterSettings {
  dailyGoal: number; // ml
  intervalMinutes: number;
  wakeTime: string; // HH:mm
  sleepTime: string; // HH:mm
}

export interface ReminderLog {
  id: string;
  refId: string; // medicine or reminder id
  refType: "medicine" | "custom" | "water";
  title: string;
  scheduledFor: number; // timestamp
  status: ReminderStatus;
  completedAt?: number;
}

export interface AppSettings {
  theme: "light" | "dark" | "system";
  notificationSound: boolean;
  vibration: boolean;
  water: WaterSettings;
}
