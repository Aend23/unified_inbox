// src/lib/integrations/factory.ts
import { sendMessage } from "./twilio";
import { sendEmail } from "./email";

export type Channel = "sms" | "whatsapp" | "email" | "twitter" | "messenger";

export function createSender(channel: Channel) {
  switch (channel) {
    case "sms":
    case "whatsapp":
      return {
        send: (payload: Parameters<typeof sendMessage>[0]) => sendMessage(payload),
      };
    case "email":
      return {
        send: async (payload: { to: string; body: string; subject?: string }) => {
          return sendEmail({
            to: payload.to,
            subject: payload.subject || "Message from Unified Inbox",
            body: payload.body,
          });
        },
      };
    // placeholder twitter/messenger senders: implement later
    default:
      return {
        send: async () => {
          throw new Error(`Sender for ${channel} not implemented.`);
        },
      };
  }
}
