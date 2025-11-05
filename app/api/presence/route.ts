import { NextRequest, NextResponse } from "next/server";
import { push } from "@/lib/pusher.server";
import { getCurrentUser } from "@/lib/auth";

interface PresencePayload {
  contactId: string;
  action: "join" | "leave";
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: PresencePayload = await req.json();
    const { contactId, action, user } = body;

    const channelName = `presence-contact-${contactId}`;

    if (action === "join") {
      await push(channelName, "user-joined", {
        id: user.id,
        name: user.name,
        email: user.email,
      });
    } else if (action === "leave") {
      await push(channelName, "user-left", {
        userId: user.id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error handling presence:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to handle presence" },
      { status: 500 }
    );
  }
}
