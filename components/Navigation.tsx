"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export function Navigation() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name?: string; email: string } | null>(null);

  useEffect(() => {
    // Fetch current user
    fetch("/api/auth/get-session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        // Ignore errors
      });
  }, []);

  const isActive = (path: string) => pathname === path;

  async function handleSignOut() {
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      window.location.href = "/login";
    } catch (err) {
      console.error("Sign out error:", err);
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6">
            <Link href="/inbox" className="text-xl font-bold text-blue-600">
              Unified Inbox
            </Link>
            <div className="flex gap-1">
              <Link
                href="/inbox"
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive("/inbox")
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Inbox
              </Link>
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/settings"
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive("/settings")
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Settings
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">
                  {user.name || user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded hover:bg-gray-50"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1 rounded hover:bg-blue-50"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

