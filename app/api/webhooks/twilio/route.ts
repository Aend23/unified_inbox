// src/app/api/webhooks/twilio/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { push } from "@/lib/pusher.server";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const from = String(form.get("From") || "");
  const body = String(form.get("Body") || "");
  const mediaCount = Number(form.get("NumMedia") || 0);
  const channel = from.includes("whatsapp") ? "WHATSAPP" : "SMS";

  // Normalize phone (strip whatsapp: prefix)
  const normalizedFrom = from.replace(/^whatsapp:/, "");

  let contact = await prisma.contact.findFirst({ where: { phone: normalizedFrom } });
  if (!contact) {
    contact = await prisma.contact.create({
      data: { phone: normalizedFrom, name: normalizedFrom },
    });
  }

  const message = await prisma.message.create({
    data: {
      contactId: contact.id,
      body,
      channel,
      direction: "INBOUND",
      mediaUrl: mediaCount > 0 ? String(form.get("MediaUrl0")) : null,
    },
  });

  // Publish to Pusher: contact-specific channel and inbox feed
  const channelName = `contact-${contact.id}`;
  await push(channelName, "new-message", message);
  await push("inbox", "message-created", { contactId: contact.id, messageId: message.id });

  return NextResponse.json({ status: "ok" });
}
