"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export default function SettingsPage() {

  const twilioNumbers = useQuery({
    queryKey: ["twilio-numbers"],
    queryFn: async () => {
      const response = await fetch("/api/twilio/numbers");
      if (!response.ok) {
        throw new Error("Failed to fetch Twilio numbers");
      }
      return response.json();
    },
    retry: 1,
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Settings</h1>
        <Link
          href="/inbox"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          ← Back to Inbox
        </Link>
      </div>

      <div className="space-y-6">
        {/* Twilio Configuration */}
        <div className="border rounded-lg p-6 bg-white">
          <h2 className="text-xl font-semibold mb-4">Twilio Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account SID
              </label>
              <input
                type="text"
                value={process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID || ""}
                disabled
                className="w-full border rounded px-3 py-2 bg-gray-50 text-gray-500"
                placeholder="Configured via environment variables"
              />
              <p className="text-xs text-gray-500 mt-1">
                Set via TWILIO_ACCOUNT_SID environment variable
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (SMS)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={twilioNumbers.data?.trialNumber || ""}
                  disabled
                  className="flex-1 border rounded px-3 py-2 bg-gray-50 text-gray-500"
                  placeholder="Fetching from Twilio..."
                />
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled
                >
                  Refresh
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Trial number from Twilio account
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Sandbox
              </label>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    twilioNumbers.data?.whatsappEnabled ? "bg-green-500" : "bg-gray-400"
                  }`}
                ></div>
                <span className="text-sm">
                  {twilioNumbers.data?.whatsappEnabled
                    ? "WhatsApp Sandbox Enabled"
                    : "WhatsApp Sandbox Disabled"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Configure WhatsApp Sandbox in your Twilio Console
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h3 className="font-medium text-yellow-800 mb-2">⚠️ Trial Mode</h3>
              <p className="text-sm text-yellow-700">
                You are using a Twilio trial number. In trial mode, you can only send
                messages to verified phone numbers. To send to any number,{" "}
                <a
                  href="https://www.twilio.com/console/phone-numbers/incoming"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  purchase a phone number
                </a>{" "}
                and upgrade your account.
              </p>
            </div>
          </div>
        </div>

        {/* Integration Comparison Table */}
        <div className="border rounded-lg p-6 bg-white">
          <h2 className="text-xl font-semibold mb-4">Integration Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Channel</th>
                  <th className="text-left py-2 px-3 font-medium">Latency</th>
                  <th className="text-left py-2 px-3 font-medium">Cost/Msg</th>
                  <th className="text-left py-2 px-3 font-medium">Reliability</th>
                  <th className="text-left py-2 px-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">SMS (Twilio)</td>
                  <td className="py-2 px-3">&lt; 5s</td>
                  <td className="py-2 px-3">~$0.0075</td>
                  <td className="py-2 px-3">99.9%</td>
                  <td className="py-2 px-3">
                    <span className="text-green-600">✓ Active</span>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">WhatsApp (Twilio)</td>
                  <td className="py-2 px-3">&lt; 10s</td>
                  <td className="py-2 px-3">~$0.005</td>
                  <td className="py-2 px-3">99.5%</td>
                  <td className="py-2 px-3">
                    <span className="text-green-600">✓ Active</span>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">Email</td>
                  <td className="py-2 px-3">&lt; 30s</td>
                  <td className="py-2 px-3">~$0.0001</td>
                  <td className="py-2 px-3">95%</td>
                  <td className="py-2 px-3">
                    <span className="text-gray-600">○ Not Configured</span>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">Twitter/X</td>
                  <td className="py-2 px-3">~5-15s</td>
                  <td className="py-2 px-3">Free</td>
                  <td className="py-2 px-3">90%</td>
                  <td className="py-2 px-3">
                    <span className="text-gray-600">○ Not Configured</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Facebook Messenger</td>
                  <td className="py-2 px-3">~3-10s</td>
                  <td className="py-2 px-3">Free</td>
                  <td className="py-2 px-3">92%</td>
                  <td className="py-2 px-3">
                    <span className="text-gray-600">○ Not Configured</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Environment Variables Info */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Required Environment Variables</h2>
          <div className="space-y-2 text-sm font-mono">
            <div>DATABASE_URL=postgresql://...</div>
            <div>TWILIO_ACCOUNT_SID=AC...</div>
            <div>TWILIO_AUTH_TOKEN=...</div>
            <div>TWILIO_PHONE_NUMBER=+1234567890</div>
            <div>TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890</div>
            <div>ABLY_API_KEY=...</div>
            <div>BETTER_AUTH_SECRET=...</div>
            <div>GOOGLE_CLIENT_ID=... (optional)</div>
            <div>GOOGLE_CLIENT_SECRET=... (optional)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

