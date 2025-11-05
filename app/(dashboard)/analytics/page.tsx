"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Clock, MessageSquare, Users, Download } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays } from "date-fns";

interface AnalyticsData {
  totalMessages: number;
  totalContacts: number;
  avgResponseTime: number;
  channelDistribution: { channel: string; count: number }[];
  messageTimeline: { date: string; inbound: number; outbound: number }[];
  responseTimeData: { hour: number; avgTime: number }[];
}

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["analytics"],
    queryFn: () => fetch("/api/analytics").then((r) => r.json()),
  });

  const COLORS = ["#4F46E5", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444"];

  const exportReport = () => {
    if (!analytics) return;

    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalMessages: analytics.totalMessages,
        totalContacts: analytics.totalContacts,
        avgResponseTime: analytics.avgResponseTime,
      },
      channelDistribution: analytics.channelDistribution,
      messageTimeline: analytics.messageTimeline,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-report-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6" data-testid="analytics-page">
        {/* Header */}
        <div className="mb-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-sm text-gray-600">Track engagement and performance metrics</p>
              </div>
            </div>
            <button
              onClick={exportReport}
              disabled={!analytics}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6 animate-fadeIn">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn">
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">Total Messages</h3>
                  <MessageSquare className="w-8 h-8 text-blue-600 opacity-20" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalMessages}</p>
                <p className="text-xs text-gray-500 mt-1">All channels</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">Total Contacts</h3>
                  <Users className="w-8 h-8 text-green-600 opacity-20" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalContacts}</p>
                <p className="text-xs text-gray-500 mt-1">Active contacts</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">Avg Response Time</h3>
                  <Clock className="w-8 h-8 text-purple-600 opacity-20" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {formatTime(analytics.avgResponseTime)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Time to respond</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">Engagement Rate</h3>
                  <TrendingUp className="w-8 h-8 text-orange-600 opacity-20" />
                </div>
                <p className="text-3xl font-bold text-gray-900">78%</p>
                <p className="text-xs text-gray-500 mt-1">↑ 12% from last week</p>
              </div>
            </div>

            {/* Channel Distribution */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm animate-fadeIn">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Channel Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.channelDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.channel}: ${entry.count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.channelDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Message Timeline */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm animate-fadeIn">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Message Volume (Last 7 Days)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.messageTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="inbound"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Inbound"
                  />
                  <Line
                    type="monotone"
                    dataKey="outbound"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    name="Outbound"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Response Time by Hour */}
            {analytics.responseTimeData && analytics.responseTimeData.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm animate-fadeIn">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Response Time by Hour</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" label={{ value: "Hour of Day", position: "insideBottom", offset: -5 }} />
                    <YAxis label={{ value: "Minutes", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Bar dataKey="avgTime" fill="#8B5CF6" name="Avg Response Time (min)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-300">
            <BarChart3 className="w-20 h-20 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No analytics data available</h3>
            <p className="text-gray-600">Start sending messages to see analytics</p>
          </div>
        )}
      </div>
    </div>
  );
}
