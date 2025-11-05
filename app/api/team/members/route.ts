import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all team members (if user has a team, get their team members, otherwise get all users)
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { team: { include: { members: true } } },
    });

    let members;
    if (dbUser?.team) {
      members = dbUser.team.members;
    } else {
      // If no team, return all users for mentions
      members = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        take: 50,
      });
    }

    return NextResponse.json(members);
  } catch (error: unknown) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch team members" },
      { status: 500 }
    );
  }
}
