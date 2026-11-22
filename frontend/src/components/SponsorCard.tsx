"use client";

import Link from "next/link";
import { Megaphone } from "lucide-react";

type Props = {
  title: string;
  description: string;
  cta: string;
  href?: string;
};

export default function SponsorCard({ title, description, cta, href = "/jobs" }: Props) {
  return (
    <section className="premium-card p-4 sm:p-5">
      <p className="text-[11px] uppercase tracking-wide text-slate-500 inline-flex items-center gap-1">
        <Megaphone className="h-3.5 w-3.5 text-emerald-700" />
        Sponsored
      </p>
      <h3 className="mt-2 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <Link href={href} className="mt-4 inline-block rounded-lg theme-gradient-brand px-3 py-2 text-sm font-medium text-white">
        {cta}
      </Link>
    </section>
  );
}
