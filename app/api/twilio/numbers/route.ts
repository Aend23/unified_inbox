import { NextResponse } from "next/server";
import { client } from "@/lib/integrations/twilio";
import { getCurrentUser } from "@/lib/auth";

/**
 * Fetch Twilio phone numbers
 * GET /api/twilio/numbers
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch phone numbers from Twilio
    const incomingNumbers = await client.incomingPhoneNumbers.list({ limit: 20 });
    
    const numbers = incomingNumbers.map((number) => ({
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      capabilities: number.capabilities,
      sid: number.sid,
    }));

    // Get WhatsApp sandbox status
    // Note: This requires checking your Twilio WhatsApp sandbox configuration
    const whatsappEnabled = !!process.env.TWILIO_WHATSAPP_NUMBER;

    return NextResponse.json({
      numbers,
      trialNumber: process.env.NEXT_PUBLIC_TWILIO_TRIAL_NUMBER || incomingNumbers[0]?.phoneNumber || null,
      whatsappEnabled,
    });
  } catch (error: unknown) {
    console.error("Error fetching Twilio numbers:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch Twilio numbers" },
      { status: 500 }
    );
  }
}


