"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getPusherClient } from "@/lib/pusher.client";

export function useAblyInbox() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const pusher = getPusherClient();
    const inboxChannel = pusher.subscribe("inbox");

    const onMessage = (data: any) => {
      console.log("📩 New message in inbox:", data);
      queryClient.invalidateQueries(["messages"]);
    };
    const onNote = (data: any) => {
      console.log("🗒️ New note added:", data);
      queryClient.invalidateQueries(["contacts"]);
    };

    inboxChannel.bind("message-created", onMessage);
    inboxChannel.bind("note-created", onNote);

    return () => {
      try {
        inboxChannel.unbind("message-created", onMessage);
        inboxChannel.unbind("note-created", onNote);
        pusher.unsubscribe("inbox");
      } catch {}
    };
  }, [queryClient]);
}
