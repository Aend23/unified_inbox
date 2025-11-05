"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { 
  ArrowLeft, 
  MessageSquare, 
  Users, 
  Clock, 
  Calendar, 
  TrendingUp, 
  BarChart3,
  Loader2
} from "lucide-react";

export default function Dashboard() {
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => fetch("/api/analytics").then((r) => r.json()),
  });

  const { data: scheduled, isLoading: scheduledLoading } = useQuery({
    queryKey: ["scheduled"],
    queryFn: () => fetch("/api/schedule").then((r) => r.json()),
  });

  if (analyticsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const { summary, byChannel, byDirection, dailyStats } = analytics;

  const channelConfigs: Record<string, { bg: string; icon: string }> = {
    SMS: { bg: "from-blue-500 to-blue-600", icon: "📧" },
    WHATSAPP: { bg: "from-green-500 to-green-600", icon: "💬" },
    EMAIL: { bg: "from-purple-500 to-purple-600", icon: "📧" },
    TWITTER: { bg: "from-sky-500 to-sky-600", icon: "🐦" },
    MESSENGER: { bg: "from-blue-500 to-indigo-600", icon: "📬" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" data-testid="dashboard-page">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-fadeIn">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-sm text-gray-600">Track your messaging performance</p>
            </div>
          </div>
          <Link
            href="/inbox"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-indigo-300 hover:text-indigo-700 transition-all shadow-sm hover:shadow-md"
            data-testid="back-to-inbox-link"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Inbox
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Messages */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 animate-fadeIn">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{summary.totalMessages}</div>
              </div>
            </div>
            <div className="text-blue-100 text-sm font-medium mb-1">Total Messages</div>
            <div className="flex items-center gap-1 text-xs text-white/80">
              <TrendingUp className="w-3 h-3" />
              <span>{summary.messages24h} in last 24h</span>
            </div>
          </div>

          {/* Total Contacts */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 animate-fadeIn" style={{ animationDelay: "50ms" }}>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{summary.totalContacts}</div>
              </div>
            </div>
            <div className="text-purple-100 text-sm font-medium mb-1">Total Contacts</div>
            <div className="text-xs text-white/80">Active conversations</div>
          </div>

          {/* Avg Response Time */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 animate-fadeIn" style={{ animationDelay: "100ms" }}>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {summary.avgResponseTimeMinutes > 0
                    ? `${summary.avgResponseTimeMinutes}`
                    : "N/A"}
                </div>
              </div>
            </div>
            <div className="text-green-100 text-sm font-medium mb-1">Avg Response Time</div>
            <div className="text-xs text-white/80">
              {summary.avgResponseTimeMinutes > 0 ? "minutes" : "No data yet"}
            </div>
          </div>

          {/* Scheduled Messages */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 animate-fadeIn" style={{ animationDelay: "150ms" }}>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{summary.scheduledCount}</div>
              </div>
            </div>
            <div className="text-orange-100 text-sm font-medium mb-1">Scheduled Messages</div>
            <div className="text-xs text-white/80">Pending delivery</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Channel Distribution */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 animate-fadeIn" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Messages by Channel</h2>
            </div>
            <div className="space-y-4">
              {byChannel.map((item: { channel: string; count: number; percentage: number }) => {
                const config = channelConfigs[item.channel] || { bg: "from-gray-500 to-gray-600", icon: "💬" };
                return (
                  <div key={item.channel}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{config.icon}</span>
                        <span className="text-sm font-semibold text-gray-700">{item.channel}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {item.count} <span className="text-gray-500 font-normal">({item.percentage}%)</span>
                      </span>
                    </div>
                    <div className="relative w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 bg-gradient-to-r ${config.bg} rounded-full transition-all duration-500 shadow-sm`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Message Direction */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 animate-fadeIn" style={{ animationDelay: "250ms" }}>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Message Direction</h2>
            </div>
            <div className="space-y-6">
              {/* Inbound */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">↓</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Inbound</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {byDirection.inbound} <span className="text-gray-500 font-normal">({byDirection.inboundPercentage}%)</span>
                  </span>
                </div>
                <div className="relative w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${byDirection.inboundPercentage}%` }}
                  ></div>
                </div>
              </div>
              {/* Outbound */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">↑</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Outbound</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {byDirection.outbound} <span className="text-gray-500 font-normal">({byDirection.outboundPercentage}%)</span>
                  </span>
                </div>
                <div className="relative w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${byDirection.outboundPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Stats */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8 animate-fadeIn" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Message Volume (Last 7 Days)</h2>
          </div>
          <div className="space-y-3">
            {dailyStats.map((day: { date: string; inbound: number; outbound: number; total: number }, index: number) => {
              const maxTotal = Math.max(...dailyStats.map((d: any) => d.total), 1);
              const percentage = (day.total / maxTotal) * 100;
              return (
                <div key={day.date} className="group">
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium text-gray-700">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="flex-1 relative">
                      <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                        <div
                          className="h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-end px-3 transition-all duration-500 group-hover:from-indigo-600 group-hover:to-purple-600"
                          style={{ width: `${Math.max(percentage, 5)}%` }}
                        >
                          {day.total > 0 && (
                            <span className="text-xs text-white font-bold">{day.total}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium w-28">
                      <span className="text-green-600 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        {day.inbound}↓
                      </span>
                      <span className="text-blue-600 flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        {day.outbound}↑
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scheduled Messages */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 animate-fadeIn" style={{ animationDelay: "350ms" }}>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Scheduled Messages</h2>
          </div>
          {scheduledLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">Loading scheduled messages...</p>
            </div>
          ) : scheduled && scheduled.length > 0 ? (
            <div className="space-y-3">
              {scheduled.map((s: { id: string; body: string; channel: string; scheduledAt: string; contact: { name?: string; phone?: string; email?: string } }) => (
                <div key={s.id} className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-400 rounded-xl p-4 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-orange-700">
                            {(s.contact.name || s.contact.phone || s.contact.email || "?")[0].toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {s.contact.name || s.contact.phone || s.contact.email}
                        </p>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed mb-2">{s.body}</p>
                    </div>
                    <div className="text-right ml-4">
                      <span className="inline-block text-xs px-3 py-1 rounded-full bg-orange-200 text-orange-800 font-semibold mb-2">
                        {s.channel}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Clock className="w-3 h-3" />
                        <p>{new Date(s.scheduledAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No scheduled messages</p>
              <p className="text-sm text-gray-400">Schedule messages from the inbox</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}