/**
 * Notification service abstraction.
 * Currently a no-op / console adapter. Swap to Capacitor LocalNotifications
 * (@capacitor/local-notifications) in a native build without touching business logic.
 */

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  at: number; // epoch ms
  sound?: boolean;
  vibration?: boolean;
  actions?: Array<{ id: "done" | "snooze" | "skip"; title: string }>;
  data?: Record<string, unknown>;
}

export interface NotificationAdapter {
  schedule(n: ScheduledNotification): Promise<void>;
  cancel(id: string): Promise<void>;
  cancelAll(): Promise<void>;
  listPending(): Promise<ScheduledNotification[]>;
}

class LocalStubAdapter implements NotificationAdapter {
  private pending = new Map<string, ScheduledNotification>();
  async schedule(n: ScheduledNotification) {
    this.pending.set(n.id, n);
  }
  async cancel(id: string) {
    this.pending.delete(id);
  }
  async cancelAll() {
    this.pending.clear();
  }
  async listPending() {
    return Array.from(this.pending.values());
  }
}

let adapter: NotificationAdapter = new LocalStubAdapter();

export function setNotificationAdapter(a: NotificationAdapter) {
  adapter = a;
}

export const notifications = {
  schedule: (n: ScheduledNotification) => adapter.schedule(n),
  cancel: (id: string) => adapter.cancel(id),
  cancelAll: () => adapter.cancelAll(),
  listPending: () => adapter.listPending(),
};
