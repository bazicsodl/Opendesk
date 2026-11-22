"use client";

import { useState } from "react";
import { Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus("Weâ€™ve sent a password reset email if the account exists.");
    } catch {
      setStatus("Something went wrong, try again.");
    }

    setLoading(false);
  }

  return (
    <div className="auth-shell">
      <div className="auth-grid">
        <section className="brand-panel">
          <div className="brand-top">
            <div className="brand-mark">O</div>
            <h1 className="brand-title">Account Recovery</h1>
            <p className="brand-subtitle">
              Secure your access and resume your progress in minutes.
            </p>
          </div>
          <div className="brand-highlights">
            <div className="brand-card">
              <div className="brand-card-icon">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3>Security-first</h3>
                <p>Your account stays protected while we guide you back in.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="form-panel">
          <div className="form-card">
            <div className="form-header">
              <p className="form-kicker">Forgot password</p>
              <h2>Reset your access</h2>
              <p className="form-subtitle">Enter your email to receive a reset link.</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <label className="field">
                <span>Email address</span>
                <div className="field-input">
                  <Mail className="w-4 h-4" />
                  <input
                    type="email"
                    placeholder="you@opendesk.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </label>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  "Sending..."
                ) : (
                  <>
                    Send reset link
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {status && (
              <div className="alert success">
                <span>{status}</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
