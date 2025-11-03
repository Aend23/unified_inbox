"use client";

import Pusher from "pusher-js";

let pusher: Pusher | null = null;

export function getPusherClient() {
  if (pusher) return pusher;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY!;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER!;
  if (!key || !cluster) throw new Error("Missing NEXT_PUBLIC_PUSHER_KEY/CLUSTER");
  pusher = new Pusher(key, { cluster });
  return pusher;
}


