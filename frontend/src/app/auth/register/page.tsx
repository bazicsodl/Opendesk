"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { 
  UserPlus, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2,
  CheckCircle,
  User,
  Shield,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  BriefcaseBusiness
} from "lucide-react";
import Link from "next/link";

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const validateForm = () => {
    if (!form.email || !form.name || !form.password || !form.confirmPassword) {
      setMessage({ text: "Please fill in all fields", type: "error" });
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setMessage({ text: "Please enter a valid email address", type: "error" });
      return false;
    }
    
    if (form.password !== form.confirmPassword) {
      setMessage({ text: "Passwords do not match", type: "error" });
      return false;
    }
    
    if (form.password.length < 8) {
      setMessage({ text: "Password must be at least 8 characters long", type: "error" });
      return false;
    }
    
    return true;
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const handlePasswordChange = (value: string) => {
    setForm({ ...form, password: value });
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setMessage(null);

    try {
      const res = await apiFetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name
        }),
      });

      setMessage({
        text: res.message || "Registration successful! Redirecting...",
        type: "success"
      });

      // Clear form on success
      setForm({
        email: "",
        name: "",
        password: "",
        confirmPassword: ""
      });

      // Redirect to login after delay
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);

    } catch (err: any) {
      setMessage({
        text: err?.message || "Registration failed. Please try again.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength < 25) return "bg-red-500";
    if (strength < 50) return "bg-orange-500";
    if (strength < 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="auth-shell">
      <div className="auth-grid">
        <section className="brand-panel">
          <div className="brand-top">
            <div className="brand-mark">O</div>
            <h1 className="brand-title">Opendesk</h1>
            <p className="brand-subtitle">
              Build the profile, portfolio, and reputation that move doors.
            </p>
          </div>

          <div className="brand-highlights">
            <div className="brand-card">
              <div className="brand-card-icon">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3>Crafted presence</h3>
                <p>Showcase your work with elegance and clarity.</p>
              </div>
            </div>
            <div className="brand-card">
              <div className="brand-card-icon">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3>Trusted by teams</h3>
                <p>Verified identity and thoughtful onboarding for serious hiring.</p>
              </div>
            </div>
            <div className="brand-card">
              <div className="brand-card-icon">
                <BriefcaseBusiness className="w-5 h-5" />
              </div>
              <div>
                <h3>Real-time momentum</h3>
                <p>Never miss a message, interview, or opportunity.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="form-panel">
          <div className="form-card">
            <div className="form-header">
              <p className="form-kicker">Create your account</p>
              <h2>Join the new hiring standard</h2>
              <p className="form-subtitle">Designed for modern talent and modern teams.</p>
            </div>

            {message && (
              <div className={`alert ${message.type === "success" ? "success" : "error"}`}>
                {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : null}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <label className="field">
                <span>Full name</span>
                <div className="field-input">
                  <User className="w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Jordan Ellis"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </label>

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
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
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

              <label className="field">
                <span>Confirm password</span>
                <div className="field-input">
                  <Shield className="w-4 h-4" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-xs text-red-600">Passwords do not match</p>
                )}
              </label>

              {form.password && (
                <div className="strength">
                  <div className="strength-header">
                    <span>Password strength</span>
                    <strong>
                      {passwordStrength < 25 ? "Weak" :
                       passwordStrength < 50 ? "Fair" :
                       passwordStrength < 75 ? "Good" : "Strong"}
                    </strong>
                  </div>
                  <div className="strength-bar">
                    <div
                      className={`strength-fill ${getStrengthColor(passwordStrength)}`}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                </div>
              )}

              <label className="checkbox">
                <input type="checkbox" required />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" className="text-link">Terms</Link> and{" "}
                  <Link href="/privacy" className="text-link">Privacy Policy</Link>.
                </span>
              </label>

              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="form-footer">
              <span>Already a member?</span>
              <Link href="/auth/login" className="text-link">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
