import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total messages
    const totalMessages = await prisma.message.count();
    const messages24h = await prisma.message.count({
      where: { createdAt: { gte: last24h } },
    });
    const messages7d = await prisma.message.count({
      where: { createdAt: { gte: last7d } },
    });
    const messages30d = await prisma.message.count({
      where: { createdAt: { gte: last30d } },
    });

    // Messages by channel
    const messagesByChannel = await prisma.message.groupBy({
      by: ["channel"],
      _count: { id: true },
    });

    // Messages by direction
    const inboundCount = await prisma.message.count({
      where: { direction: "INBOUND" },
    });
    const outboundCount = await prisma.message.count({
      where: { direction: "OUTBOUND" },
    });

    // Response time calculation (average time between inbound and next outbound)
    const contacts = await prisma.contact.findMany({
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    let totalResponseTime = 0;
    let responseCount = 0;

    contacts.forEach((contact) => {
      const messages = contact.messages;
      for (let i = 0; i < messages.length - 1; i++) {
        if (messages[i].direction === "INBOUND" && messages[i + 1].direction === "OUTBOUND") {
          const responseTime = messages[i + 1].createdAt.getTime() - messages[i].createdAt.getTime();
          totalResponseTime += responseTime;
          responseCount++;
        }
      }
    });

    const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
    const avgResponseTimeMinutes = Math.round(avgResponseTime / (60 * 1000));

    // Messages over time (last 7 days)
    const messagesOverTime = await prisma.message.findMany({
      where: { createdAt: { gte: last7d } },
      select: { createdAt: true, channel: true, direction: true },
    });

    // Group by day
    const dailyStats: Record<string, { inbound: number; outbound: number; total: number }> = {};
    messagesOverTime.forEach((msg) => {
      const day = msg.createdAt.toISOString().split("T")[0];
      if (!dailyStats[day]) {
        dailyStats[day] = { inbound: 0, outbound: 0, total: 0 };
      }
      dailyStats[day].total++;
      if (msg.direction === "INBOUND") {
        dailyStats[day].inbound++;
      } else {
        dailyStats[day].outbound++;
      }
    });

    // Total contacts
    const totalContacts = await prisma.contact.count();

    // Scheduled messages
    const scheduledCount = await prisma.scheduledMessage.count({
      where: { status: "PENDING" },
    });

    // Channel distribution percentages
    const channelDistribution = messagesByChannel.map((item) => ({
      channel: item.channel,
      count: item._count.id,
      percentage: totalMessages > 0 ? Math.round((item._count.id / totalMessages) * 100) : 0,
    }));

    return NextResponse.json({
      summary: {
        totalMessages,
        messages24h,
        messages7d,
        messages30d,
        totalContacts,
        scheduledCount,
        avgResponseTimeMinutes,
      },
      byChannel: channelDistribution,
      byDirection: {
        inbound: inboundCount,
        outbound: outboundCount,
        inboundPercentage: totalMessages > 0 ? Math.round((inboundCount / totalMessages) * 100) : 0,
        outboundPercentage: totalMessages > 0 ? Math.round((outboundCount / totalMessages) * 100) : 0,
      },
      dailyStats: Object.entries(dailyStats).map(([date, stats]: [string, { inbound: number; outbound: number; total: number }]) => ({
        date,
        ...stats,
      })),
    });
  } catch (error: unknown) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch analytics" }, { status: 500 });
  }
}

