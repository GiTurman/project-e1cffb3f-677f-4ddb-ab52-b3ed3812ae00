import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  downloadCsv,
  formatDateTime,
  formatDuration,
  isOpen,
  PRIORITIES,
  priorityLabel,
  SERVICE_TYPES,
  serviceTypeLabel,
  slaState,
  statusLabel,
  type ServiceCall,
} from "@/lib/domain";
import { callsQuery, staffQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "რეპორტები — ლიფტსერვისი" },
      { name: "description", content: "KPI და ანალიტიკა გამოძახებებზე." },
    ],
  }),
  component: ReportsPage,
});

const PALETTE = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#64748b"];

type RangeKey = "7" | "30" | "90" | "all";

function ReportsPage() {
  const { data: calls = [] } = useQuery(callsQuery);
  const { data: staff = [] } = useQuery(staffQuery);
  const [range, setRange] = useState<RangeKey>("30");

  const filtered = useMemo(() => {
    if (range === "all") return calls;
    const days = Number(range);
    const from = new Date();
    from.setDate(from.getDate() - days);
    return calls.filter((c) => new Date(c.received_at) >= from);
  }, [calls, range]);

  const total = filtered.length;
  const open = filtered.filter((c) => isOpen(c.status)).length;
  const closed = total - open;

  const responded = filtered.filter((c) => c.responded_at);
  const avgResponseMs =
    responded.length === 0
      ? 0
      : responded.reduce(
          (sum, c) =>
            sum +
            (new Date(c.responded_at!).getTime() -
              new Date(c.received_at).getTime()),
          0,
        ) / responded.length;

  const slaEvaluated = filtered.filter((c) => {
    const s = slaState(c);
    return s === "met" || s === "breached";
  });
  const slaMet = slaEvaluated.filter((c) => slaState(c) === "met").length;
  const slaPct =
    slaEvaluated.length === 0
      ? 0
      : Math.round((slaMet / slaEvaluated.length) * 100);

  const byPriority = PRIORITIES.map((p) => ({
    name: p.label,
    value: filtered.filter((c) => c.priority === p.value).length,
  }));
  const byType = SERVICE_TYPES.map((t) => ({
    name: t.label,
    value: filtered.filter((c) => c.service_type === t.value).length,
  })).filter((d) => d.value > 0);
  const byTech = staff
    .map((s) => ({
      name: s.full_name,
      value: filtered.filter((c) => c.assigned_to === s.id).length,
    }))
    .filter((d) => d.value > 0);
  const openClosed = [
    { name: "ღია", value: open },
    { name: "დახურული", value: closed },
  ].filter((d) => d.value > 0);

  const nameOf = (id: string | null) =>
    staff.find((s) => s.id === id)?.full_name ?? "";

  function exportCsv() {
    const rows = filtered.map((c: ServiceCall) => ({
      "N": c.call_no,
      "ობიექტი": c.site_name,
      "მისამართი": c.address,
      "ტიპი": serviceTypeLabel[c.service_type],
      "პრიორიტეტი": priorityLabel[c.priority],
      "სტატუსი": statusLabel[c.status],
      "ტექნიკოსი": nameOf(c.assigned_to),
      "მიღების დრო": formatDateTime(c.received_at),
      "რეაგირება": formatDateTime(c.responded_at),
      "დასრულება": formatDateTime(c.completed_at),
    }));
    downloadCsv(`rezaltebi-${range}.csv`, rows);
  }

  return (
    <AppShell
      title="რეპორტები"
      subtitle="KPI და ანალიტიკა"
      actions={
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">ბოლო 7 დღე</SelectItem>
              <SelectItem value="30">ბოლო 30 დღე</SelectItem>
              <SelectItem value="90">ბოლო 90 დღე</SelectItem>
              <SelectItem value="all">მთელი პერიოდი</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download className="size-4" /> CSV
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="სულ გამოძახება" value={String(total)} />
        <Kpi label="ღია" value={String(open)} />
        <Kpi label="დახურული" value={String(closed)} />
        <Kpi
          label="საშ. რეაგირება"
          value={avgResponseMs ? formatDuration(avgResponseMs) : "—"}
        />
        <Kpi label="SLA შესრულება" value={`${slaPct}%`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="გამოძახებები პრიორიტეტით">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byPriority}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {byPriority.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="ღია vs დახურული">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={openClosed}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                label
              >
                {openClosed.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="გამოძახებები ტიპით">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={byType}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label
              >
                {byType.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="დატვირთვა ტექნიკოსით">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byTech} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis type="number" allowDecimals={false} fontSize={12} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                fontSize={12}
              />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} fill={PALETTE[0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </AppShell>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
