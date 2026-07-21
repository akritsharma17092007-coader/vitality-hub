import { format } from "date-fns";
import { Check, X, Clock3, Pill, Bell, Droplet } from "lucide-react";
import { motion, useAnimation, type PanInfo } from "framer-motion";
import { useLogReminder } from "@/hooks/use-app-data";
import type { OccurrenceItem } from "@/lib/scheduling";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { Calendar } from "lucide-react";

const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Medicine: Pill,
  Water: Droplet,
};

export function TimelineList({
  items,
  showActions = false,
  completedIds,
}: {
  items: OccurrenceItem[];
  showActions?: boolean;
  completedIds?: Set<string>;
}) {
  const log = useLogReminder();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="Nothing scheduled"
        description="Add a medicine, water goal, or reminder to see it here."
      />
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
    toast.success(
      status === "done" ? "Marked as done" : status === "skipped" ? "Skipped" : "Snoozed 10 min",
    );
  };

  return (
    <ul className="space-y-2">
      {items.map((item, idx) => {
        const key = `${item.refId}-${item.time}-${idx}`;
        const done = completedIds?.has(`${item.refId}-${item.time}`);
        return (
          <motion.li
            key={key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.02, 0.2) }}
          >
            <SwipeRow item={item} showActions={showActions} done={done} onAction={handle} />
          </motion.li>
        );
      })}
    </ul>
  );
}

function SwipeRow({
  item, showActions, done, onAction,
}: {
  item: OccurrenceItem;
  showActions: boolean;
  done?: boolean;
  onAction: (item: OccurrenceItem, status: "done" | "skipped" | "snoozed") => void;
}) {
  const controls = useAnimation();
  const Icon = CATEGORY_ICON[item.category] ?? Bell;

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (!showActions) { controls.start({ x: 0 }); return; }
    if (info.offset.x > 90) {
      controls.start({ x: 0 });
      onAction(item, "done");
    } else if (info.offset.x < -90) {
      controls.start({ x: 0 });
      onAction(item, "skipped");
    } else {
      controls.start({ x: 0 });
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[calc(var(--radius)+8px)]">
      {showActions && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center gap-1 pl-4 text-success">
            <Check className="h-4 w-4" /> <span className="text-xs font-medium">Done</span>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-1 pr-4 text-danger">
            <span className="text-xs font-medium">Skip</span> <X className="h-4 w-4" />
          </div>
        </>
      )}
      <motion.div
        drag={showActions ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        animate={controls}
        onDragEnd={onDragEnd}
        className={`card-elevated flex items-center gap-3 p-3 ${done ? "opacity-60" : ""}`}
      >
        <div
          aria-hidden
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
          style={{ backgroundColor: `${item.color}22`, border: `1px solid ${item.color}55` }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className={`truncate text-sm font-semibold ${done ? "line-through" : ""}`}>
              {item.title}
            </p>
            <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
              {format(item.at, "HH:mm")}
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
              style={{ backgroundColor: `${item.color}22`, color: item.color }}
            >
              {item.category}
            </span>
            {item.subtitle && (
              <span className="truncate text-muted-foreground">· {item.subtitle}</span>
            )}
          </p>
        </div>
        {showActions && (
          <div className="hidden shrink-0 items-center gap-1 sm:flex">
            <Button size="icon" variant="ghost" aria-label="Mark done" onClick={() => onAction(item, "done")}>
              <Check className="h-4 w-4 text-success" />
            </Button>
            <Button size="icon" variant="ghost" aria-label="Snooze" onClick={() => onAction(item, "snoozed")}>
              <Clock3 className="h-4 w-4 text-warning" />
            </Button>
            <Button size="icon" variant="ghost" aria-label="Skip" onClick={() => onAction(item, "skipped")}>
              <X className="h-4 w-4 text-danger" />
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
