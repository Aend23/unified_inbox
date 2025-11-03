import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    return NextResponse.json({ user: session?.user || null });
  } catch (error: any) {
    console.error("Error getting session:", error);
    return NextResponse.json({ user: null });
  }
}


