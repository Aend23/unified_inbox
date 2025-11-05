import Pusher from "pusher";

const appId = '2072577';
const key = 'e6b9ad6a1f0859c1514a';
const secret = '2b510e37c067a981e169';
const cluster = 'ap2';

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


