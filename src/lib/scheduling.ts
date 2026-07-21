import type { Medicine, CustomReminder, RepeatType } from "./types";
import { addDays, differenceInCalendarDays, isAfter, isBefore, parseISO, setHours, setMinutes, setSeconds, startOfDay } from "date-fns";

export function parseTimeToDate(time: string, base: Date = new Date()): Date {
  const [h, m] = time.split(":").map(Number);
  return setSeconds(setMinutes(setHours(startOfDay(base), h || 0), m || 0), 0);
}

function occursOn(
  date: Date,
  startDate: string,
  endDate: string | undefined,
  repeat: RepeatType,
  repeatDays: number[] | undefined,
  repeatInterval: number | undefined,
): boolean {
  const day = startOfDay(date);
  const start = startOfDay(parseISO(startDate));
  if (isBefore(day, start)) return false;
  if (endDate && isAfter(day, startOfDay(parseISO(endDate)))) return false;
  const dow = day.getDay();
  switch (repeat) {
    case "daily":
      return true;
    case "weekdays":
      return dow >= 1 && dow <= 5;
    case "weekends":
      return dow === 0 || dow === 6;
    case "specific":
      return !!repeatDays?.includes(dow);
    case "everyX":
    case "custom":
      if (!repeatInterval || repeatInterval < 1) return true;
      return differenceInCalendarDays(day, start) % repeatInterval === 0;
  }
}

export interface OccurrenceItem {
  refId: string;
  refType: "medicine" | "custom";
  title: string;
  subtitle?: string;
  color: string;
  icon?: string;
  time: string;
  at: Date;
  category: string;
}

export function medicineOccurrences(m: Medicine, date: Date): OccurrenceItem[] {
  if (m.paused) return [];
  if (!occursOn(date, m.startDate, m.endDate, m.repeat, m.repeatDays, m.repeatInterval)) return [];
  return m.times.map((t) => ({
    refId: m.id,
    refType: "medicine" as const,
    title: m.name,
    subtitle: `${m.dosage} • ${m.food}`,
    color: m.color,
    time: t,
    at: parseTimeToDate(t, date),
    category: "Medicine",
  }));
}

export function reminderOccurrences(r: CustomReminder, date: Date): OccurrenceItem[] {
  if (r.paused) return [];
  // Custom reminders use "today" as start
  if (!occursOn(date, new Date(0).toISOString(), undefined, r.repeat, r.repeatDays, r.repeatInterval)) return [];
  return [{
    refId: r.id,
    refType: "custom" as const,
    title: r.title,
    subtitle: r.description,
    color: r.color,
    icon: r.icon,
    time: r.time,
    at: parseTimeToDate(r.time, date),
    category: r.category,
  }];
}

export function buildTodayTimeline(
  medicines: Medicine[],
  reminders: CustomReminder[],
  date: Date = new Date(),
): OccurrenceItem[] {
  const items = [
    ...medicines.flatMap((m) => medicineOccurrences(m, date)),
    ...reminders.flatMap((r) => reminderOccurrences(r, date)),
  ];
  return items.sort((a, b) => a.at.getTime() - b.at.getTime());
}

export function nextUpcoming(items: OccurrenceItem[], now: Date = new Date()): OccurrenceItem | undefined {
  return items.find((i) => i.at.getTime() >= now.getTime());
}

export function addDaysISO(iso: string, days: number) {
  return addDays(parseISO(iso), days).toISOString();
}
