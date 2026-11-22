"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import { Mail, Lock, LogIn, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default function RecruiterLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: any) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      saveAuth(res.user, res.token);
      if (res?.user?.role !== "recruiter") {
        setLoading(false);
        setError("This account is not a recruiter account.");
        return;
      }
      try {
        await apiFetch("/recruiter/me");
        router.push("/recruiter/dashboard");
      } catch {
        router.push("/recruiter/setup-profile");
      }
    } catch (err: any) {
      setError(err?.message || "Login failed");
    }

    setLoading(false);
  }

  return (
    <div className="auth-shell">
      <div className="auth-grid">
        <section className="brand-panel">
          <div className="brand-top">
            <div className="brand-mark">O</div>
            <h1 className="brand-title">Recruiter Console</h1>
            <p className="brand-subtitle">
              Build trusted pipelines with transparency, speed, and care.
            </p>
          </div>
          <div className="brand-highlights">
            <div className="brand-card">
              <div className="brand-card-icon">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3>Verified hiring</h3>
                <p>Signal quality applicants and reduce noise at the top of funnel.</p>
              </div>
            </div>
            <div className="brand-card">
              <div className="brand-card-icon">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3>Pipeline clarity</h3>
                <p>Track progress, message faster, and keep candidates informed.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="form-panel">
          <div className="form-card">
            <div className="form-header">
              <p className="form-kicker">Recruiter access</p>
              <h2>Sign in to your hiring desk</h2>
              <p className="form-subtitle">Continue where your team left off.</p>
            </div>

            {error && <div className="alert error"><span>{error}</span></div>}

            <form onSubmit={handleLogin} className="space-y-5">
              <label className="field">
                <span>Email</span>
                <div className="field-input">
                  <Mail className="w-4 h-4" />
                  <input
                    type="email"
                    placeholder="recruiter@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </label>

              <label className="field">
                <span>Password</span>
                <div className="field-input">
                  <Lock className="w-4 h-4" />
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </label>

              <button className="btn-primary" disabled={loading}>
                {loading ? (
                  "Signing in..."
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="form-footer">
              <span>Need an account?</span>
              <Link href="/recruiter/register" className="text-link">
                Create recruiter profile
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
