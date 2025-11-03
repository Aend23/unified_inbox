import { NextRequest, NextResponse } from "next/server";
import { sendMessage } from "@/lib/integrations/twilio";
import { prisma } from "@/lib/prisma";
import { sendMessageSchema } from "@/lib/validation";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = sendMessageSchema.parse(body);
    const { to, body: messageBody, channel, mediaUrl } = validated;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find or create contact (phone is not unique in schema, so can't use upsert)
    let contact = await prisma.contact.findFirst({ where: { phone: to } });
    if (!contact) {
      contact = await prisma.contact.create({ data: { phone: to, name: to } });
    }

    // Send message via Twilio
    const result = await sendMessage({
      to,
      body: messageBody,
      channel: (channel as "sms" | "whatsapp") || "sms",
      mediaUrl,
    });

    // Save to DB
    const message = await prisma.message.create({
      data: {
        contactId: contact.id,
        senderId: user.id,
        body: messageBody,
        channel: (channel?.toUpperCase() as any) || "SMS",
        direction: "OUTBOUND",
        mediaUrl: mediaUrl || null,
      },
    });

    return NextResponse.json({ success: true, message, sid: result.sid });
  } catch (error: any) {
    console.error("Error sending message:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
