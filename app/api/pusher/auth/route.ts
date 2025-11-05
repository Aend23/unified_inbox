// Pusher authentication endpoint for private channels
import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher.server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.text();
    const params = new URLSearchParams(body);
    const socketId = params.get("socket_id")!;
    const channelName = params.get("channel_name")!;

    // Validate channel access based on user permissions
    if (
      channelName.startsWith("private-note-") ||
      channelName.startsWith("presence-note-") ||
      channelName.startsWith("presence-contact-")
    ) {
      const authResponse = pusherServer.authorizeChannel(socketId, channelName, {
        user_id: user.id,
        user_info: {
          id: user.id,
          name: user.name || user.email,
          email: user.email,
          role: user.role,
          color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)` // Random color for cursor
        }
      });
      return NextResponse.json(authResponse);
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error: unknown) {
    console.error("Pusher auth error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Authentication failed" },
      { status: 500 }
    );
  }
}