import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to cancel schedules
    await requireRole("EDITOR");

    const scheduled = await prisma.scheduledMessage.findUnique({
      where: { id },
    });

    if (!scheduled) {
      return NextResponse.json({ error: "Scheduled message not found" }, { status: 404 });
    }

    if (scheduled.status !== "PENDING") {
      return NextResponse.json(
        { error: "Can only cancel pending messages" },
        { status: 400 }
      );
    }

    await prisma.scheduledMessage.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true, message: "Scheduled message cancelled" });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Insufficient permissions") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    console.error("Error cancelling scheduled message:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel scheduled message" },
      { status: 500 }
    );
  }
}
