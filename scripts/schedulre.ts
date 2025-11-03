import { prisma } from "../lib/prisma";
import { sendMessage } from "../lib/integrations/twilio";
import * as cron from "node-cron";

async function processScheduledMessages() {
  const now = new Date();

  const due = await prisma.scheduledMessage.findMany({
    where: {
      status: "PENDING",
      scheduledAt: { lte: now },
    },
    include: { contact: true },
  });

  if (due.length === 0) {
    console.log(`⏰ No scheduled messages to process at`, now.toISOString());
    return;
  }

  console.log(`📅 Processing ${due.length} scheduled message(s) at`, now.toISOString());

  for (const msg of due) {
    try {
      // Only send if contact has a phone number and channel is SMS/WhatsApp
      if (!msg.contact.phone || (msg.channel !== "SMS" && msg.channel !== "WHATSAPP")) {
        console.warn(`⚠️ Skipping message ${msg.id}: missing phone or unsupported channel`);
        await prisma.scheduledMessage.update({
          where: { id: msg.id },
          data: { status: "CANCELLED" },
        });
        continue;
      }

      await sendMessage({
        to: msg.contact.phone,
        body: msg.body,
        channel: msg.channel.toLowerCase() as "sms" | "whatsapp",
      });

      // Save as outbound message
      await prisma.message.create({
        data: {
          contactId: msg.contactId,
          body: msg.body,
          channel: msg.channel,
          direction: "OUTBOUND",
        },
      });

      await prisma.scheduledMessage.update({
        where: { id: msg.id },
        data: { status: "SENT", sentAt: new Date() },
      });

      console.log(`✅ Sent scheduled message ${msg.id}`);
    } catch (err) {
      console.error(`❌ Failed to send scheduled message ${msg.id}:`, err);
    }
  }
}

// Run every minute
cron.schedule("* * * * *", () => {
  processScheduledMessages().catch(console.error);
});

console.log("🚀 Message scheduler started. Checking every minute...");
processScheduledMessages(); // Run immediately on startup
