import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scheduleMessageSchema } from "@/lib/validation";
import { getCurrentUser, requireRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = scheduleMessageSchema.parse(body);
    const { contactId, body: messageBody, channel, scheduledAt } = validated;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to schedule messages (EDITOR or ADMIN)
    await requireRole("EDITOR");

    // Verify contact exists
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Verify scheduled time is in the future
    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: "Scheduled time must be in the future" },
        { status: 400 }
      );
    }

    const scheduled = await prisma.scheduledMessage.create({
      data: {
        contactId,
        body: messageBody,
        channel,
        scheduledAt: scheduledDate,
      },
      include: { contact: true },
    });

    return NextResponse.json(scheduled, { status: 201 });
  } catch (error: unknown) {
    console.error("Error scheduling message:", error);
    if (typeof error === "object" && error && (error as { name?: string }).name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to schedule message" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const scheduled = await prisma.scheduledMessage.findMany({
      where: { status: "PENDING" },
      include: { contact: true },
      orderBy: { scheduledAt: "asc" },
    });
    return NextResponse.json(scheduled);
  } catch (error: unknown) {
    console.error("Error fetching scheduled messages:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch scheduled messages" },
      { status: 500 }
    );
  }
}
