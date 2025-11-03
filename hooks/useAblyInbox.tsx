"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getPusherClient } from "@/lib/pusher.client";

export function useAblyInbox() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const pusher = getPusherClient();
    const inboxChannel = pusher.subscribe("inbox");

    const onMessage = (data: unknown) => {
      console.log("📩 New message in inbox:", data);
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    };
    const onNote = (data: unknown) => {
      console.log("🗒️ New note added:", data);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
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
