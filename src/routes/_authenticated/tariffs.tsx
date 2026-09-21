import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/useAuth";
import { dbx, formatGel, tariffsQuery } from "@/lib/entities";

export const Route = createFileRoute("/_authenticated/tariffs")({
  head: () => ({
    meta: [
      { title: "ტარიფები — ლიფტსერვისი" },
      { name: "description", content: "მომსახურების პაკეტები და ფასები." },
    ],
  }),
  component: TariffsPage,
});

const empty = {
  name: "",
  code: "",
  price_monthly: "0",
  response_sla_hours: "",
  included_services: "",
};

function TariffsPage() {
  const queryClient = useQueryClient();
  const { isDispatcher } = useCurrentUser();
  const { data: packages = [] } = useQuery(tariffsQuery);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("პაკეტის სახელი სავალდებულოა");
      const { error } = await dbx.from("tariff_packages").insert({
        name: form.name.trim(),
        code: form.code || null,
        price_monthly: Number(form.price_monthly) || 0,
        response_sla_hours: form.response_sla_hours
          ? Number(form.response_sla_hours)
          : null,
        included_services: form.included_services || null,
        sort_order: packages.length + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tariff_packages"] });
      setOpen(false);
      setForm({ ...empty });
      toast.success("პაკეტი დაემატა");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell
      title="ტარიფები"
      subtitle="მომსახურების პაკეტები"
      actions={
        isDispatcher ? (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> პაკეტის დამატება
          </Button>
        ) : null
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <div className="flex items-baseline justify-between">
                <CardTitle className="text-base">{p.name}</CardTitle>
                <span className="text-lg font-semibold tabular-nums">
                  {formatGel(p.price_monthly)}
                  <span className="text-xs text-muted-foreground">/თვე</span>
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">რეაგირების SLA: </span>
                {p.response_sla_hours
                  ? `${p.response_sla_hours} საათი`
                  : "პრიორიტეტის მიხედვით"}
              </div>
              {p.included_services ? (
                <p className="text-sm text-muted-foreground">
                  {p.included_services}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
        {packages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            პაკეტები არ არის. დაამატეთ პირველი.
          </p>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ახალი პაკეტი</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>სახელი *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="მაგ. პლატინუმი"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>ფასი (₾/თვე)</Label>
                <Input
                  type="number"
                  value={form.price_monthly}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price_monthly: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>SLA (საათი)</Label>
                <Input
                  type="number"
                  value={form.response_sla_hours}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      response_sla_hours: e.target.value,
                    }))
                  }
                  placeholder="ცარიელი = პრიორიტეტით"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>რას მოიცავს</Label>
              <Textarea
                rows={3}
                value={form.included_services}
                onChange={(e) =>
                  setForm((f) => ({ ...f, included_services: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              გაუქმება
            </Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending ? "ინახება…" : "დამატება"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
