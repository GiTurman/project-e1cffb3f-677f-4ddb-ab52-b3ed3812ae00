import { cn } from "@/lib/utils";
import {
  priorityLabel,
  slaLabel,
  slaState,
  statusLabel,
  type CallPriority,
  type CallStatus,
  type ServiceCall,
} from "@/lib/domain";

const base =
  "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4 whitespace-nowrap";

const priorityStyles: Record<CallPriority, string> = {
  kritikuli: "border-destructive/30 bg-destructive/10 text-destructive",
  maghali: "border-warning/40 bg-warning/15 text-warning-foreground",
  sashualo: "border-primary/25 bg-primary/10 text-primary",
  dabali: "border-border bg-muted text-muted-foreground",
};

const statusStyles: Record<CallStatus, string> = {
  akhali: "border-primary/30 bg-primary/10 text-primary",
  mighebuli: "border-primary/20 bg-primary/5 text-primary",
  gzashi: "border-warning/40 bg-warning/15 text-warning-foreground",
  mimdinare: "border-warning/50 bg-warning/20 text-warning-foreground",
  shesrulebuli: "border-success/30 bg-success/10 text-success",
  dakhuruli: "border-border bg-muted text-muted-foreground",
  gaukmebuli: "border-border bg-muted text-muted-foreground line-through",
};

export function PriorityBadge({ value }: { value: CallPriority }) {
  return (
    <span className={cn(base, priorityStyles[value])}>
      {priorityLabel[value]}
    </span>
  );
}

export function StatusBadge({ value }: { value: CallStatus }) {
  return (
    <span className={cn(base, statusStyles[value])}>{statusLabel[value]}</span>
  );
}

export function SlaBadge({ call }: { call: ServiceCall }) {
  const state = slaState(call);
  if (state === "none") return <span className="text-muted-foreground">—</span>;
  const styles = {
    ok: "border-success/30 bg-success/10 text-success",
    met: "border-success/30 bg-success/10 text-success",
    warning: "border-warning/50 bg-warning/20 text-warning-foreground",
    breached: "border-destructive/40 bg-destructive/15 text-destructive",
  }[state];
  return <span className={cn(base, styles)}>{slaLabel[state]}</span>;
}
