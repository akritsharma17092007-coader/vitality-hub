import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { Moon, Sun, Monitor, Download, Upload, Trash2, Info as InfoIcon, Shield } from "lucide-react";
import { useSettings, useSaveSettings } from "@/hooks/use-app-data";
import { useTheme } from "@/hooks/use-theme";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: settings } = useSettings();
  const saveSettings = useSaveSettings();
  const { theme, setTheme } = useTheme();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const exportData = async () => {
    const data = await db.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `health-reminder-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  };

  const importData = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await db.importAll(data);
      await qc.invalidateQueries();
      toast.success("Data restored");
    } catch {
      toast.error("Invalid backup file");
    }
  };

  const resetAll = async () => {
    if (!confirm("Delete all local data? This cannot be undone.")) return;
    await db.clearAll();
    await qc.invalidateQueries();
    toast.success("All data cleared");
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Personalize your experience</p>
      </header>

      <Section title="Appearance">
        <div className="flex gap-2">
          {[
            { v: "light", label: "Light", icon: Sun },
            { v: "dark", label: "Dark", icon: Moon },
            { v: "system", label: "System", icon: Monitor },
          ].map(({ v, label, icon: Icon }) => (
            <button
              key={v}
              onClick={() => setTheme(v as typeof theme)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-2xl border-2 p-3 transition-colors ${
                theme === v ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </Section>

      {settings && (
        <Section title="Notifications">
          <Row label="Notification sound"
            checked={settings.notificationSound}
            onChange={(v) => saveSettings.mutate({ ...settings, notificationSound: v })} />
          <Row label="Vibration"
            checked={settings.vibration}
            onChange={(v) => saveSettings.mutate({ ...settings, vibration: v })} />
          <p className="pt-1 text-[11px] text-muted-foreground">
            Local notifications activate when installed as a native app.
          </p>
        </Section>
      )}

      <Section title="Data">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={exportData}><Download className="mr-2 h-4 w-4" /> Export</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importData(f); e.target.value = ""; }} />
        </div>
        <Button variant="outline" className="w-full text-danger hover:text-danger" onClick={resetAll}>
          <Trash2 className="mr-2 h-4 w-4" /> Reset application
        </Button>
      </Section>

      <Section title="About">
        <InfoRow label="Version" value="1.0.0" icon={<InfoIcon className="h-4 w-4" />} />
        <InfoRow label="Privacy" value="All data stored locally on your device." icon={<Shield className="h-4 w-4" />} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="card-elevated space-y-2 p-4">{children}</div>
    </section>
  );
}
function Row({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
function InfoRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{value}</div>
      </div>
    </div>
  );
}
