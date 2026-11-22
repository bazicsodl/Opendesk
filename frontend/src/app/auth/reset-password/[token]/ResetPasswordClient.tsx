"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ClientProps {
  params: { token: string };
}

export default function ResetPasswordClient({ params }: ClientProps) {
  const { token } = params;

  const [password, setPassword] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      await apiFetch(`/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      setStatus("success");

      // Redirect after success
      setTimeout(() => router.push("/auth/login"), 1500);
    } catch (err: any) {
      setStatus(err?.message || "Network error");
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-grid">
        <section className="brand-panel">
          <div className="brand-top">
            <div className="brand-mark">O</div>
            <h1 className="brand-title">Password Reset</h1>
            <p className="brand-subtitle">
              Choose a new password and get back to your flow.
            </p>
          </div>
          <div className="brand-highlights">
            <div className="brand-card">
              <div className="brand-card-icon">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3>Secure reset</h3>
                <p>We only update access after your confirmation.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="form-panel">
          <div className="form-card">
            <div className="form-header">
              <p className="form-kicker">Reset password</p>
              <h2>Set a new password</h2>
              <p className="form-subtitle">Choose a strong password to protect your account.</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <label className="field">
                <span>New password</span>
                <div className="field-input">
                  <Lock className="w-4 h-4" />
                  <input
                    type="password"
                    placeholder="Enter a new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </label>

              <button type="submit" disabled={status === "loading"} className="btn-primary">
                {status === "loading" ? (
                  "Updating..."
                ) : (
                  <>
                    Reset password
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {status && status !== "loading" && (
              <div className={`alert ${status === "success" ? "success" : "error"}`}>
                <span>{status === "success" ? "Password updated" : status}</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
