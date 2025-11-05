"use client";

import { useEffect, useState } from "react";
import { getPusherClient } from "@/lib/pusher.client";

interface PresenceUser {
  id: string;
  name: string;
  email: string;
}

export function usePresence(contactId: string, currentUser: PresenceUser | null) {
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!contactId || !currentUser) return;

    const pusher = getPusherClient();
    const channelName = `presence-contact-${contactId}`;
    const channel = pusher.subscribe(channelName);

    // Announce presence
    fetch("/api/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId,
        action: "join",
        user: currentUser,
      }),
    }).catch(console.error);

    // Listen for presence updates
    channel.bind("user-joined", (data: PresenceUser) => {
      if (data.id === currentUser.id) return; // ignore self
      setActiveUsers((prev) => {
        if (prev.find((u) => u.id === data.id)) return prev;
        return [...prev, data];
      });
    });

    channel.bind("user-left", (data: { userId: string }) => {
      if (data.userId === currentUser.id) return; // ignore self
      setActiveUsers((prev) => prev.filter((u) => u.id !== data.userId));
    });

    return () => {
      // Announce leaving
      fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          action: "leave",
          user: currentUser,
        }),
      }).catch(console.error);

      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [contactId, currentUser]);

  return { activeUsers };
}
