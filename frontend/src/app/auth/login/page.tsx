"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { 
  LogIn, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2,
  User,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  BriefcaseBusiness
} from "lucide-react";
import Link from "next/link";
import { saveAuth } from "@/lib/auth";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.email || !form.password) {
      setError("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      saveAuth(res.user, res.token);
      
      // Show success animation
      setTimeout(() => {
        if (res?.user?.role === "recruiter") {
          router.push("/recruiter/dashboard");
        } else {
          router.push("/");
        }
        router.refresh();
      }, 1000);
      
    } catch (err: any) {
      setError(err?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-grid">
        <section className="brand-panel">
          <div className="brand-top">
            <div className="brand-mark">O</div>
            <h1 className="brand-title">Opendesk</h1>
            <p className="brand-subtitle">
              A career operating system for ambitious teams and builders.
            </p>
          </div>

          <div className="brand-highlights">
            <div className="brand-card">
              <div className="brand-card-icon">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3>Signal over noise</h3>
                <p>Curated opportunities, intelligent matches, and clear next steps.</p>
              </div>
            </div>
            <div className="brand-card">
              <div className="brand-card-icon">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3>Trust by design</h3>
                <p>Verified profiles, recruiter accountability, and transparent hiring flow.</p>
              </div>
            </div>
            <div className="brand-card">
              <div className="brand-card-icon">
                <BriefcaseBusiness className="w-5 h-5" />
              </div>
              <div>
                <h3>Momentum built in</h3>
                <p>Live updates, real-time messaging, and a hiring pipeline you can feel.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="form-panel">
          <div className="form-card">
            <div className="form-header">
              <p className="form-kicker">Welcome back</p>
              <h2>Sign in to continue</h2>
              <p className="form-subtitle">Your next chapter is already moving.</p>
            </div>

            {error && (
              <div className="alert error">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="field">
                <span>Email address</span>
                <div className="field-input">
                  <Mail className="w-4 h-4" />
                  <input
                    type="email"
                    placeholder="you@opendesk.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </label>

              <label className="field">
                <span>Password</span>
                <div className="field-input">
                  <Lock className="w-4 h-4" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </label>

              <div className="form-row">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span>Keep me signed in</span>
                </label>
                <Link href="/auth/forgot-password" className="text-link">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
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
              <span>New here?</span>
              <Link href="/auth/register" className="text-link">
                Create an account
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
