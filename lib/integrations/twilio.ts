import twilio from "twilio";
import type { MessageListInstanceCreateOptions } from "twilio/lib/rest/api/v2010/account/message";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
export const client = twilio(accountSid, authToken);

type SendMessagePayload = {
  to: string;
  body: string;
  channel?: "sms" | "whatsapp";
  mediaUrl?: string;
};

export async function sendMessage({ to, body, channel = "sms", mediaUrl }: SendMessagePayload) {
  const from =
    channel === "whatsapp"
      ? process.env.TWILIO_WHATSAPP_NUMBER
      : process.env.TWILIO_PHONE_NUMBER;

  if (!from) {
    throw new Error("Twilio 'from' number is not configured in environment variables.");
  }

  const media: string[] | undefined = mediaUrl ? [mediaUrl] : undefined;

  const options: MessageListInstanceCreateOptions = {
    from,
    to: channel === "whatsapp" ? `whatsapp:${to}` : to,
    body,
    ...(media ? { mediaUrl: media } as Pick<MessageListInstanceCreateOptions, "mediaUrl"> : {}),
  };

  return await client.messages.create(options);
}
