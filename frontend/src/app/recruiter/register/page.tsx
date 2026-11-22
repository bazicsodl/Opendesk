"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Mail, Lock, User, UserPlus, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

export default function RecruiterRegister() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleRegister(e: any) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await apiFetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role: "recruiter" }),
      });

      setMsg(res?.message || "Account created. Please verify your email.");
      setTimeout(() => router.push("/recruiter/login"), 1500);
    } catch (err: any) {
      setMsg(err?.message || "Something went wrong");
    }

    setLoading(false);
  }

  return (
    <div className="auth-shell">
      <div className="auth-grid">
        <section className="brand-panel">
          <div className="brand-top">
            <div className="brand-mark">O</div>
            <h1 className="brand-title">Recruiter Workspace</h1>
            <p className="brand-subtitle">
              Set up your company presence and hire with intention.
            </p>
          </div>
          <div className="brand-highlights">
            <div className="brand-card">
              <div className="brand-card-icon">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3>Verified company identity</h3>
                <p>Build trust with candidates from the first touch.</p>
              </div>
            </div>
            <div className="brand-card">
              <div className="brand-card-icon">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3>Premium candidate experience</h3>
                <p>Signal clarity, care, and speed throughout the process.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="form-panel">
          <div className="form-card">
            <div className="form-header">
              <p className="form-kicker">Create recruiter account</p>
              <h2>Start hiring with confidence</h2>
              <p className="form-subtitle">Launch your recruiter profile in minutes.</p>
            </div>

            {msg && (
              <div className={`alert ${msg.toLowerCase().includes("error") ? "error" : "success"}`}>
                <span>{msg}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <label className="field">
                <span>Full name</span>
                <div className="field-input">
                  <User className="w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Avery Johnson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </label>

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
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </label>

              <button className="btn-primary" disabled={loading}>
                {loading ? (
                  "Creating account..."
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create recruiter account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="form-footer">
              <span>Already have access?</span>
              <Link href="/recruiter/login" className="text-link">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
