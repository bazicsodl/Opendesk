"use client";

import { useEffect, useState } from "react";
import { Bell, Menu } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function RecruiterTopbar() {
  const [company, setCompany] = useState("Recruiter");
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    apiFetch("/recruiter/me").then((r) => setCompany(r?.company_name || "Recruiter")).catch(() => {});
    apiFetch("/notifications/unread-count").then((r) => setUnread(Number(r?.count || 0))).catch(() => {});
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 fixed left-64 right-0 top-0 z-10">
      
      <div className="flex items-center gap-2">
        <Menu className="md:hidden" />
        <h2 className="text-xl font-semibold text-slate-900">{company}</h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <Bell className="cursor-pointer text-slate-700" />
          {unread > 0 ? <span className="absolute -right-2 -top-2 rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">{unread}</span> : null}
        </div>

        <div className="w-10 h-10 bg-gradient-to-br from-emerald-700 to-amber-700 rounded-full"></div>
      </div>
    </header>
  );
}
