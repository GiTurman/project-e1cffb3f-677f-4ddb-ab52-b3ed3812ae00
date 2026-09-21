import { createFileRoute, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "ლიფტსერვისი — დისპეტჩერიზაციის სისტემა" },
      {
        name: "description",
        content:
          "ლიფტებისა და ესკალატორების სერვისის გამოძახებების, გრაფიკის, SLA-სა და პრევენციული მომსახურების მართვა.",
      },
      { property: "og:title", content: "ლიფტსერვისი — დისპეტჩერიზაცია" },
      {
        property: "og:description",
        content: "გამოძახებები, ტექნიკოსების გრაფიკი, SLA და რეპორტები.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    throw redirect({ to: data.user ? "/dashboard" : "/auth" });
  },
  component: () => null,
});
