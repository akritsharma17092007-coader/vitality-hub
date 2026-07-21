import { openDB, type IDBPDatabase } from "idb";
import type {
  Medicine,
  CustomReminder,
  WaterEntry,
  ReminderLog,
  AppSettings,
} from "./types";

const DB_NAME = "health-reminder";
const DB_VERSION = 1;

interface Schema {
  medicines: Medicine;
  reminders: CustomReminder;
  water: WaterEntry;
  logs: ReminderLog;
  settings: { key: string; value: unknown };
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB unavailable in SSR");
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("medicines")) db.createObjectStore("medicines", { keyPath: "id" });
        if (!db.objectStoreNames.contains("reminders")) db.createObjectStore("reminders", { keyPath: "id" });
        if (!db.objectStoreNames.contains("water")) db.createObjectStore("water", { keyPath: "id" });
        if (!db.objectStoreNames.contains("logs")) db.createObjectStore("logs", { keyPath: "id" });
        if (!db.objectStoreNames.contains("settings")) db.createObjectStore("settings", { keyPath: "key" });
      },
    });
  }
  return dbPromise;
}

async function all<K extends keyof Schema>(store: K): Promise<Schema[K][]> {
  const db = await getDB();
  return db.getAll(store as string) as Promise<Schema[K][]>;
}

async function put<K extends keyof Schema>(store: K, value: Schema[K]) {
  const db = await getDB();
  await db.put(store as string, value);
}

async function del(store: keyof Schema, id: string) {
  const db = await getDB();
  await db.delete(store as string, id);
}

async function clearAll() {
  const db = await getDB();
  await Promise.all(
    ["medicines", "reminders", "water", "logs", "settings"].map((s) => db.clear(s)),
  );
}

export const db = {
  // medicines
  listMedicines: () => all("medicines"),
  saveMedicine: (m: Medicine) => put("medicines", m),
  deleteMedicine: (id: string) => del("medicines", id),
  // reminders
  listReminders: () => all("reminders"),
  saveReminder: (r: CustomReminder) => put("reminders", r),
  deleteReminder: (id: string) => del("reminders", id),
  // water
  listWater: () => all("water"),
  saveWater: (w: WaterEntry) => put("water", w),
  deleteWater: (id: string) => del("water", id),
  // logs
  listLogs: () => all("logs"),
  saveLog: (l: ReminderLog) => put("logs", l),
  deleteLog: (id: string) => del("logs", id),
  // settings
  async getSettings(): Promise<AppSettings | null> {
    const db_ = await getDB();
    const row = await db_.get("settings", "app");
    return (row?.value as AppSettings) ?? null;
  },
  async saveSettings(settings: AppSettings) {
    await put("settings", { key: "app", value: settings });
  },
  clearAll,
  async exportAll() {
    return {
      medicines: await all("medicines"),
      reminders: await all("reminders"),
      water: await all("water"),
      logs: await all("logs"),
      settings: await this.getSettings(),
      exportedAt: Date.now(),
    };
  },
  async importAll(data: Awaited<ReturnType<typeof db.exportAll>>) {
    await clearAll();
    for (const m of data.medicines ?? []) await put("medicines", m);
    for (const r of data.reminders ?? []) await put("reminders", r);
    for (const w of data.water ?? []) await put("water", w);
    for (const l of data.logs ?? []) await put("logs", l);
    if (data.settings) await put("settings", { key: "app", value: data.settings });
  },
};

export function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
