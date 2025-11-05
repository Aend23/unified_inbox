// Mark message as read
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const message = await prisma.message.findUnique({
      where: { id },
      select: { readBy: true },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Add user to readBy array if not already present
    if (!message.readBy.includes(user.id)) {
      await prisma.message.update({
        where: { id },
        data: {
          readBy: {
            push: user.id,
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error marking message as read:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to mark message as read" },
      { status: 500 }
    );
  }
}
