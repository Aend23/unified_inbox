import { NextRequest, NextResponse } from "next/server";
import { sendMessage } from "@/lib/integrations/twilio";
import { prisma } from "@/lib/prisma";
import { sendMessageSchema } from "@/lib/validation";
import { getCurrentUser, requireRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = sendMessageSchema.parse(body);
    const { to, body: messageBody, channel, mediaUrl } = validated;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to send messages (EDITOR or ADMIN)
    await requireRole("EDITOR");

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
  } catch (error: unknown) {
    console.error("Error sending message:", error);
    if (typeof error === "object" && error && (error as { name?: string }).name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send message" },
      { status: 500 }
    );
  }
}
