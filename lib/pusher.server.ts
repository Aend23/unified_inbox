import Pusher from "pusher";

const appId = process.env.PUSHER_APP_ID;
const key = process.env.PUSHER_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.PUSHER_CLUSTER;

if (!appId || !key || !secret || !cluster) {
  throw new Error("Missing Pusher configuration. Set PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER.");
}

export const pusherServer = new Pusher({
  appId,
  key,
  secret,
  cluster,
  useTLS: true,
});

export async function push(channel: string, event: string, data: unknown) {
  await pusherServer.trigger(channel, event, data);
}


