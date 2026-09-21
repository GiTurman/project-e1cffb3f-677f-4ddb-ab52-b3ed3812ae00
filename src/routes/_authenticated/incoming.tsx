import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PhoneIncoming } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/domain";
import {
  clientsQuery,
  dbx,
  incomingCallsQuery,
  type IncomingCall,
} from "@/lib/entities";
import { objectsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/incoming")({
  head: () => ({
    meta: [
      { title: "ცხელი ხაზი — ლიფტსერვისი" },
      { name: "description", content: "შემოსული ზარები ცხელი ხაზიდან." },
    ],
  }),
  component: IncomingPage,
});

function IncomingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isDispatcher, userId } = useCurrentUser();
  const { data: incoming = [] } = useQuery(incomingCallsQuery);
  const { data: clients = [] } = useQuery(clientsQuery);
  const { data: objects = [] } = useQuery(objectsQuery);

  // Realtime: ახალი ზარი ავტომატურად გამოჩნდეს
  useEffect(() => {
    const channel = supabase
      .channel("incoming_calls_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "incoming_calls" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["incoming_calls"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const clientName = (id: string | null) =>
    clients.find((c) => c.id === id)?.name ?? null;
  const object = (id: string | null) => objects.find((o) => o.id === id) ?? null;

  const createFromCall = useMutation({
    mutationFn: async (ic: IncomingCall) => {
      const obj = object(ic.matched_object_id);
      const cName = clientName(ic.matched_client_id);
      const client = clients.find((c) => c.id === ic.matched_client_id);
      const { data: call, error } = await dbx
        .from("service_calls")
        .insert({
          object_id: ic.matched_object_id,
          client_id: ic.matched_client_id,
          site_name: obj?.name ?? cName ?? "ცხელი ხაზი",
          address: obj?.address ?? client?.address ?? "—",
          elevator_code: obj?.elevator_code ?? null,
          service_type: "avaria",
          priority: "maghali",
          description: `ცხელი ხაზიდან, ნომერი: ${ic.caller_number ?? "—"}`,
          client_name: cName,
          client_phone: ic.caller_number,
          caller_number: ic.caller_number,
          source: "hotline",
          created_by: userId ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      const { error: upErr } = await dbx
        .from("incoming_calls")
        .update({ status: "linked", service_call_id: call.id })
        .eq("id", ic.id);
      if (upErr) throw upErr;
      return call.id as string;
    },
    onSuccess: (callId) => {
      queryClient.invalidateQueries({ queryKey: ["incoming_calls"] });
      queryClient.invalidateQueries({ queryKey: ["service_calls"] });
      toast.success("გამოძახება შეიქმნა");
      navigate({ to: "/calls/$callId", params: { callId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const dismiss = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await dbx
        .from("incoming_calls")
        .update({ status: "dismissed" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incoming_calls"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const newCalls = incoming.filter((c) => c.status === "new");

  return (
    <AppShell
      title="ცხელი ხაზი"
      subtitle={`ახალი ზარები: ${newCalls.length}`}
    >
      <div className="space-y-3">
        {newCalls.map((ic) => {
          const obj = object(ic.matched_object_id);
          const cName = clientName(ic.matched_client_id);
          return (
            <Card key={ic.id} className="border-primary/30">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <PhoneIncoming className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-sm font-medium">
                    {ic.caller_number ?? "უცნობი ნომერი"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {cName ? `კლიენტი: ${cName}` : "კლიენტი ვერ მოიძებნა"}
                    {obj ? ` · ${obj.name} (${obj.elevator_code})` : ""}
                    {" · "}
                    {formatDateTime(ic.received_at)}
                  </div>
                </div>
                {isDispatcher ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => createFromCall.mutate(ic)}
                      disabled={createFromCall.isPending}
                    >
                      გამოძახების შექმნა
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => dismiss.mutate(ic.id)}
                    >
                      დახურვა
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
        {newCalls.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            ახალი ზარები არ არის. შემოსული ზარი ავტომატურად გამოჩნდება აქ.
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}
