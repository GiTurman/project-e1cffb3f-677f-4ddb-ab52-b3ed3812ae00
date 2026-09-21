import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  formatDateTime,
  isOpen,
  isSameDay,
  serviceTypeLabel,
  type ServiceCall,
} from "@/lib/domain";
import { callsQuery, staffQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/schedule")({
  head: () => ({
    meta: [
      { title: "გრაფიკი — ლიფტსერვისი" },
      { name: "description", content: "ტექნიკოსების დღიური და კვირის გრაფიკი." },
    ],
  }),
  component: SchedulePage,
});

type Range = "all" | "today" | "week";

function inRange(call: ServiceCall, range: Range) {
  if (range === "all") return true;
  if (!call.scheduled_at) return false;
  const d = new Date(call.scheduled_at);
  const now = new Date();
  if (range === "today") return isSameDay(d, now);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return d >= start && d < end;
}

function SchedulePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isDispatcher, isTechnician, userId } = useCurrentUser();

  const { data: calls = [] } = useQuery(callsQuery);
  const { data: staff = [] } = useQuery(staffQuery);
  const [range, setRange] = useState<Range>("week");

  const technicians = staff.filter((s) => s.roles.includes("technician"));

  const reassign = useMutation({
    mutationFn: async ({
      callId,
      techId,
    }: {
      callId: string;
      techId: string | null;
    }) => {
      const { error } = await supabase
        .from("service_calls")
        .update({ assigned_to: techId })
        .eq("id", callId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_calls"] });
      toast.success("ტექნიკოსი განახლდა");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCalls = useMemo(
    () =>
      calls.filter(
        (c) =>
          isOpen(c.status) &&
          inRange(c, range) &&
          (!isTechnician || c.assigned_to === userId),
      ),
    [calls, range, isTechnician, userId],
  );

  const columns = isTechnician
    ? technicians.filter((t) => t.id === userId)
    : technicians;

  const unassigned = openCalls.filter((c) => !c.assigned_to);

  function CallCard({ c }: { c: ServiceCall }) {
    return (
      <div
        className="cursor-pointer rounded-md border bg-background p-2.5 hover:border-primary/40"
        onClick={() =>
          navigate({ to: "/calls/$callId", params: { callId: c.id } })
        }
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">
            #{c.call_no}
          </span>
          <PriorityBadge value={c.priority} />
        </div>
        <div className="mt-1 truncate text-sm font-medium">{c.site_name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {serviceTypeLabel[c.service_type]}
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <StatusBadge value={c.status} />
          <span className="text-[11px] text-muted-foreground">
            {c.scheduled_at ? formatDateTime(c.scheduled_at) : "დაუგეგმავი"}
          </span>
        </div>
        {isDispatcher ? (
          <div
            className="mt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Select
              value={c.assigned_to ?? "none"}
              onValueChange={(v) =>
                reassign.mutate({
                  callId: c.id,
                  techId: v === "none" ? null : v,
                })
              }
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— მიუბმელი —</SelectItem>
                {technicians.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <AppShell
      title="გრაფიკი"
      subtitle="ტექნიკოსების დატვირთვა და დაგეგმვა"
      actions={
        <Select value={range} onValueChange={(v) => setRange(v as Range)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">დღეს</SelectItem>
            <SelectItem value="week">კვირა</SelectItem>
            <SelectItem value="all">ყველა ღია</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {isDispatcher ? (
          <Card className="bg-muted/30">
            <CardContent className="p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">მიუბმელი</h3>
                <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                  {unassigned.length}
                </span>
              </div>
              <div className="space-y-2">
                {unassigned.map((c) => (
                  <CallCard key={c.id} c={c} />
                ))}
                {unassigned.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    მიუბმელი გამოძახება არ არის
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {columns.map((tech) => {
          const techCalls = openCalls.filter((c) => c.assigned_to === tech.id);
          return (
            <Card key={tech.id}>
              <CardContent className="p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="truncate text-sm font-semibold">
                    {tech.full_name}
                  </h3>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {techCalls.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {techCalls.map((c) => (
                    <CallCard key={c.id} c={c} />
                  ))}
                  {techCalls.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      გამოძახება არ არის
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
