"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

function VerifyContent() {
  const search = useSearchParams();
  const router = useRouter();
  const token = search?.get("token") || "";

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
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
        const res = await apiFetch(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
          method: "GET",
        });

        setStatus("success");
        setMessage(res?.message || "Email verified. Thank you!");
        setTimeout(() => router.push("/"), 2500);
      } catch (err: any) {
        setStatus("error");
        setMessage(err?.error || "Verification failed.");
      }
    };

    doVerify();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6 text-center">
        {status === "loading" && <p>Verifying your email...</p>}

        {status === "success" && (
          <>
            <h2 className="text-2xl font-semibold mb-2 text-green-600">
              Email verified
            </h2>
            <p>{message}</p>
            <p className="mt-3 text-sm text-gray-500">
              You will be redirected shortly.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h2 className="text-2xl font-semibold mb-2 text-red-600">
              Verification failed
            </h2>
            <p>{message}</p>

            <div className="mt-4">
              <button
                onClick={() => router.push("/settings")}
                className="px-4 py-2 bg-emerald-600 text-white rounded"
              >
                Go to Settings
              </button>
            </div>
          </>
        )}

        {status === "idle" && <p>Preparing...</p>}
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
