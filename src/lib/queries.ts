import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/domain";

export const callsQuery = queryOptions({
  queryKey: ["service_calls"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("service_calls")
      .select("*")
      .order("received_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const objectsQuery = queryOptions({
  queryKey: ["objects"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("objects")
      .select("*")
      .order("name");
    if (error) throw error;
    return data;
  },
});

export const staffQuery = queryOptions({
  queryKey: ["staff"],
  queryFn: async () => {
    const [{ data: profiles, error }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").order("full_name"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (error) throw error;
    return (profiles ?? []).map((p) => ({
      ...p,
      roles: (roles ?? [])
        .filter((r) => r.user_id === p.id)
        .map((r) => r.role as AppRole),
    }));
  },
});

export type StaffMember = Awaited<
  ReturnType<(typeof staffQuery)["queryFn"]>
>[number];

export const historyQuery = (callId: string) =>
  queryOptions({
    queryKey: ["call_history", callId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_status_history")
        .select("*")
        .eq("call_id", callId)
        .order("changed_at");
      if (error) throw error;
      return data;
    },
  });

export const notesQuery = (callId: string) =>
  queryOptions({
    queryKey: ["call_notes", callId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_notes")
        .select("*")
        .eq("call_id", callId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
