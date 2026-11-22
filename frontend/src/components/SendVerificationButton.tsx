"use client";
import { useState } from "react";
import { api } from "@/lib/api";

/**
 * SendVerificationButton
 * - Calls POST /auth/send-verification (requires auth)
 * - Shows basic UI feedback
 */
export default function SendVerificationButton() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    try {
      await api.post("/auth/send-verification");
      setSent(true);
      alert("Verification email sent — check your inbox.");
    } catch (err: any) {
      console.error("send verification error", err);
      alert(err?.response?.data?.error || "Failed to send verification email");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <button disabled className="px-4 py-2 bg-gray-300 rounded">
        Sent ✓
      </button>
    );
  }

  return (
    <button
      onClick={handleSend}
      disabled={loading}
      className="px-4 py-2 bg-emerald-600 text-white rounded disabled:opacity-60"
    >
      {loading ? "Sending..." : "Send verification email"}
    </button>
  );
}
