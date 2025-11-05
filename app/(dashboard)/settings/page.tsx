"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { 
  ArrowLeft, 
  Settings as SettingsIcon, 
  Phone, 
  MessageCircle, 
  Mail, 
  Check, 
  X, 
  AlertTriangle,
  Shield,
  Loader2
} from "lucide-react";

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

  const integrations = [
    { 
      name: "SMS (Twilio)", 
      latency: "< 5s", 
      cost: "~$0.0075", 
      reliability: "99.9%", 
      status: "active",
      icon: Phone,
      color: "blue"
    },
    { 
      name: "WhatsApp (Twilio)", 
      latency: "< 10s", 
      cost: "~$0.005", 
      reliability: "99.5%", 
      status: "active",
      icon: MessageCircle,
      color: "green"
    },
    { 
      name: "Email", 
      latency: "< 30s", 
      cost: "~$0.0001", 
      reliability: "95%", 
      status: "inactive",
      icon: Mail,
      color: "purple"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" data-testid="settings-page">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-fadeIn">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-600">Manage your configuration</p>
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

        <div className="space-y-6">
          {/* Twilio Configuration */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 animate-fadeIn">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Twilio Configuration</h2>
            </div>
            
            <div className="space-y-5">
              {/* Account SID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Account SID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Shield className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID || ""}
                    disabled
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 text-sm"
                    placeholder="Configured via environment variables"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                  Set via TWILIO_ACCOUNT_SID environment variable
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number (SMS)
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Phone className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={twilioNumbers.data?.trialNumber || ""}
                      disabled
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium text-sm"
                      placeholder={twilioNumbers.isLoading ? "Loading..." : "Not configured"}
                    />
                    {twilioNumbers.isLoading && (
                      <div className="absolute inset-y-0 right-3 flex items-center">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                  Trial number from your Twilio account
                </p>
              </div>

              {/* WhatsApp Status */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">WhatsApp Sandbox</p>
                      <p className="text-sm text-gray-600">
                        {twilioNumbers.data?.whatsappEnabled
                          ? "Sandbox is enabled and ready"
                          : "Configure in Twilio Console"}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-medium text-sm ${
                    twilioNumbers.data?.whatsappEnabled 
                      ? "bg-green-100 text-green-700" 
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {twilioNumbers.data?.whatsappEnabled ? (
                      <><Check className="w-4 h-4" /> Enabled</>
                    ) : (
                      <><X className="w-4 h-4" /> Disabled</>
                    )}
                  </div>
                </div>
              </div>

              {/* Trial Mode Warning */}
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-l-4 border-yellow-400 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-yellow-900 mb-1">Trial Mode Active</h3>
                    <p className="text-sm text-yellow-800 leading-relaxed">
                      You're using a Twilio trial number. In trial mode, messages can only be sent to verified phone numbers. 
                      <a
                        href="https://www.twilio.com/console/phone-numbers/incoming"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold underline hover:text-yellow-900 ml-1"
                      >
                        Purchase a phone number
                      </a> to send to any recipient.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Integration Comparison */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 animate-fadeIn" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Integration Comparison</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {integrations.map((integration, index) => {
                const Icon = integration.icon;
                const isActive = integration.status === "active";
                const bgColors: Record<string, string> = {
                  blue: "from-blue-500 to-blue-600",
                  green: "from-green-500 to-green-600",
                  purple: "from-purple-500 to-purple-600",
                };
                return (
                  <div key={index} className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${bgColors[integration.color]} rounded-xl flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {isActive ? "Active" : "Inactive"}
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-3">{integration.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Latency</span>
                        <span className="font-semibold text-gray-900">{integration.latency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cost/Msg</span>
                        <span className="font-semibold text-gray-900">{integration.cost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reliability</span>
                        <span className="font-semibold text-gray-900">{integration.reliability}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Environment Variables */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl p-6 text-white animate-fadeIn" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold">Required Environment Variables</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">Configure these variables in your .env file</p>
            <div className="bg-black/30 rounded-xl p-4 font-mono text-xs space-y-2 overflow-x-auto">
              <div className="text-green-400">DATABASE_URL=<span className="text-gray-400">postgresql://...</span></div>
              <div className="text-blue-400">TWILIO_ACCOUNT_SID=<span className="text-gray-400">AC...</span></div>
              <div className="text-blue-400">TWILIO_AUTH_TOKEN=<span className="text-gray-400">...</span></div>
              <div className="text-blue-400">TWILIO_PHONE_NUMBER=<span className="text-gray-400">+1234567890</span></div>
              <div className="text-blue-400">TWILIO_WHATSAPP_NUMBER=<span className="text-gray-400">whatsapp:+1234567890</span></div>
              <div className="text-purple-400">ABLY_API_KEY=<span className="text-gray-400">...</span></div>
              <div className="text-yellow-400">BETTER_AUTH_SECRET=<span className="text-gray-400">...</span></div>
              <div className="text-pink-400">GOOGLE_CLIENT_ID=<span className="text-gray-400">... (optional)</span></div>
              <div className="text-pink-400">GOOGLE_CLIENT_SECRET=<span className="text-gray-400">... (optional)</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}