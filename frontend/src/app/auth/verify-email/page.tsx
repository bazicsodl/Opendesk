"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { CheckCircle, AlertTriangle, Sparkles } from "lucide-react";

function VerifyContent() {
  const search = useSearchParams();
  const router = useRouter();
  const token = search?.get("token") || "";
  const [status, setStatus] =
    useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No token provided.");
      return;
    }

    const doVerify = async () => {
      setStatus("loading");

      try {
        const res = await apiFetch(
          `/auth/verify-email?token=${encodeURIComponent(token)}`,
          { method: "GET" }
        );

        setStatus("success");
        setMessage(res?.message || "Email verified. Thank you!");
        setTimeout(() => router.push("/auth/login"), 2500);
      } catch (err: any) {
        setStatus("error");
        setMessage(err?.message || "Verification failed.");
      }
    };

    doVerify();
  }, [token, router]);

  return (
    <div className="auth-shell">
      <div className="auth-grid">
        <section className="brand-panel">
          <div className="brand-top">
            <div className="brand-mark">O</div>
            <h1 className="brand-title">Verify Your Email</h1>
            <p className="brand-subtitle">
              One last step to activate your Opendesk account.
            </p>
          </div>
          <div className="brand-highlights">
            <div className="brand-card">
              <div className="brand-card-icon">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3>Activation in progress</h3>
                <p>This ensures your profile stays trusted and protected.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="form-panel">
          <div className="form-card text-center">
            {status === "loading" && (
              <>
                <p className="form-kicker">Verifying</p>
                <h2>Checking your email token</h2>
                <p className="form-subtitle">This takes just a moment.</p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="status-icon success">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h2>Email verified</h2>
                <p className="form-subtitle">{message}</p>
                <p className="helper-text">Redirecting you to sign in...</p>
              </>
            )}

            {status === "error" && (
              <>
                <div className="status-icon error">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h2>Verification failed</h2>
                <p className="form-subtitle">{message}</p>
                <button
                  onClick={() => router.push("/settings")}
                  className="btn-secondary mt-4"
                >
                  Go to Settings
                </button>
              </>
            )}

            {status === "idle" && <p className="form-subtitle">Preparing...</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-600">Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
