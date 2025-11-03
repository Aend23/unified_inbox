import twilio from "twilio";

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

  return await client.messages.create({
    from,
    to: channel === "whatsapp" ? `whatsapp:${to}` : to,
    body,
    ...(mediaUrl ? { mediaUrl: [mediaUrl] } : {}),
  });
}
