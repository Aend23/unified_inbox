// src/app/api/messages/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await prisma.message.findMany({
      include: {
        contact: true,
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Limit for performance
    });

    // Add isRead flag for current user
    const messagesWithReadStatus = messages.map((msg) => ({
      ...msg,
      isRead: msg.readBy.includes(user.id),
    }));

    return NextResponse.json(messagesWithReadStatus);
  } catch (error: unknown) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
