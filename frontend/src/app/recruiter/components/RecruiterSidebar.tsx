"use client";

import { Briefcase, Users, MessageSquare, BarChart2, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function RecruiterSidebar({ jobId }: { jobId?: string }) {
  const pathname = usePathname();

  const menu = [
    { name: "Jobs", icon: Briefcase, href: "/recruiter/dashboard" },
    {
      name: "Applicants",
      icon: Users,
      href: jobId ? `/recruiter/dashboard/jobs/${jobId}/applicants` : "/recruiter/dashboard/jobs",
    },
    { name: "Messages", icon: MessageSquare, href: "/recruiter/dashboard/messages" },
    { name: "Analytics", icon: BarChart2, href: "/recruiter/dashboard/analytics" },
    { name: "Settings", icon: Settings, href: "/recruiter/dashboard/settings" },
  ];

  return (
    <aside className="pt-16 h-screen w-64 bg-white border-r border-slate-200 p-4 fixed left-0 top-0">
      <h1 className="text-2xl font-bold mb-8 text-emerald-900">Recruiter</h1>

      <nav className="space-y-2">
        {menu.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-lg
                ${active ? "bg-emerald-700 text-white" : "text-slate-700 hover:bg-slate-100"}
              `}
            >
              <Icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
