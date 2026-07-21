import { format } from "date-fns";
import { Check, X, Clock3, MoreVertical } from "lucide-react";
import { motion } from "framer-motion";
import { useLogReminder } from "@/hooks/use-app-data";
import type { OccurrenceItem } from "@/lib/scheduling";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function TimelineList({ items, showActions = false }: { items: OccurrenceItem[]; showActions?: boolean }) {
  const log = useLogReminder();

  if (items.length === 0) {
    return (
      <div className="card-elevated flex flex-col items-center gap-2 p-8 text-center">
        <div className="text-sm font-medium">Nothing scheduled</div>
        <p className="text-xs text-muted-foreground">Add a medicine, water goal, or reminder to see it here.</p>
      </div>
    );
  }

  const handle = (item: OccurrenceItem, status: "done" | "skipped" | "snoozed") => {
    log.mutate({
      refId: item.refId,
      refType: item.refType,
      title: item.title,
      scheduledFor: item.at.getTime(),
      status,
      completedAt: status === "done" ? Date.now() : undefined,
    });
    toast.success(status === "done" ? "Marked as done" : status === "skipped" ? "Skipped" : "Snoozed 10 min");
  };

  return (
    <ul className="space-y-2">
      {items.map((item, idx) => (
        <motion.li
          key={`${item.refId}-${item.time}-${idx}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.03 }}
        >
          <div className="card-elevated flex items-center gap-3 p-3">
            <div
              aria-hidden
              className="h-11 w-11 shrink-0 rounded-2xl"
              style={{ backgroundColor: `${item.color}22`, border: `1px solid ${item.color}55` }}
            >
              <div className="flex h-full items-center justify-center text-sm font-semibold" style={{ color: item.color }}>
                {item.title.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-semibold">{item.title}</p>
                <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                  {format(item.at, "HH:mm")}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                    {item.category}
                  </span>
                  {item.subtitle && <span>· {item.subtitle}</span>}
                </span>
              </p>
            </div>
            {showActions ? (
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" aria-label="Mark done" onClick={() => handle(item, "done")}>
                  <Check className="h-4 w-4 text-success" />
                </Button>
                <Button size="icon" variant="ghost" aria-label="Snooze" onClick={() => handle(item, "snoozed")}>
                  <Clock3 className="h-4 w-4 text-warning" />
                </Button>
                <Button size="icon" variant="ghost" aria-label="Skip" onClick={() => handle(item, "skipped")}>
                  <X className="h-4 w-4 text-danger" />
                </Button>
              </div>
            ) : (
              <Button size="icon" variant="ghost" aria-label="More" onClick={() => handle(item, "done")}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
