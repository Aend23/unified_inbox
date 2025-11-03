"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export default function Dashboard() {
  const { data: analytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => fetch("/api/analytics").then((r) => r.json()),
  });

  const { data: scheduled } = useQuery({
    queryKey: ["scheduled"],
    queryFn: () => fetch("/api/schedule").then((r) => r.json()),
  });

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading analytics...</div>
      </div>
    );
  }

  const { summary, byChannel, byDirection, dailyStats } = analytics;

  const channelColors: Record<string, string> = {
    SMS: "bg-blue-500",
    WHATSAPP: "bg-green-500",
    EMAIL: "bg-purple-500",
    TWITTER: "bg-sky-500",
    MESSENGER: "bg-blue-600",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold">Analytics Dashboard</h1>
        <Link
          href="/inbox"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          ← Back to Inbox
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-white">
          <div className="text-sm text-gray-600 mb-1">Total Messages</div>
          <div className="text-2xl font-bold">{summary.totalMessages}</div>
          <div className="text-xs text-gray-500 mt-1">
            {summary.messages24h} in last 24h
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white">
          <div className="text-sm text-gray-600 mb-1">Total Contacts</div>
          <div className="text-2xl font-bold">{summary.totalContacts}</div>
        </div>

        <div className="border rounded-lg p-4 bg-white">
          <div className="text-sm text-gray-600 mb-1">Avg Response Time</div>
          <div className="text-2xl font-bold">
            {summary.avgResponseTimeMinutes > 0
              ? `${summary.avgResponseTimeMinutes} min`
              : "N/A"}
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white">
          <div className="text-sm text-gray-600 mb-1">Scheduled Messages</div>
          <div className="text-2xl font-bold">{summary.scheduledCount}</div>
        </div>
      </div>

      {/* Channel Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6 bg-white">
          <h2 className="text-xl font-semibold mb-4">Messages by Channel</h2>
          <div className="space-y-3">
            {byChannel.map((item: { channel: string; count: number; percentage: number }) => (
              <div key={item.channel}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{item.channel}</span>
                  <span className="text-sm text-gray-600">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${channelColors[item.channel] || "bg-gray-500"}`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-white">
          <h2 className="text-xl font-semibold mb-4">Message Direction</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Inbound</span>
                <span className="text-sm text-gray-600">
                  {byDirection.inbound} ({byDirection.inboundPercentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{ width: `${byDirection.inboundPercentage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Outbound</span>
                <span className="text-sm text-gray-600">
                  {byDirection.outbound} ({byDirection.outboundPercentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{ width: `${byDirection.outboundPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Stats */}
      <div className="border rounded-lg p-6 bg-white">
        <h2 className="text-xl font-semibold mb-4">Message Volume (Last 7 Days)</h2>
        <div className="space-y-2">
          {dailyStats.map((day: { date: string; inbound: number; outbound: number; total: number }) => (
            <div key={day.date} className="flex items-center gap-4">
              <div className="w-24 text-sm text-gray-600">
                {new Date(day.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                  <div
                    className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${Math.min((day.total / (summary.messages7d / 7)) * 100, 100)}%` }}
                  >
                    {day.total > 0 && (
                      <span className="text-xs text-white font-medium">{day.total}</span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500 w-20 text-right">
                  {day.inbound}↑ {day.outbound}↓
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled Messages */}
      <div className="border rounded-lg p-6 bg-white">
        <h2 className="text-xl font-semibold mb-4">Scheduled Messages</h2>
        {scheduled && scheduled.length > 0 ? (
          <div className="space-y-2">
            {scheduled.map((s: { id: string; body: string; channel: string; scheduledAt: string; contact: { name?: string; phone?: string; email?: string } }) => (
              <div key={s.id} className="border rounded p-3 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">
                      {s.contact.name || s.contact.phone || s.contact.email}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">{s.body}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                      {s.channel}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(s.scheduledAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            No scheduled messages
          </div>
        )}
      </div>
    </div>
  );
}

