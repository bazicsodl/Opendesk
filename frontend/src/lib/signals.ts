type AnyRecord = Record<string, any>;

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeArray(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }
  if (typeof input === "string") {
    return input
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function computeProfileStrength(profile: AnyRecord | null | undefined) {
  const p = profile || {};
  const fields = [
    { ok: hasText(p.name), label: "Add your display name", weight: 10 },
    { ok: hasText(p.headline), label: "Add a clear headline", weight: 14 },
    { ok: hasText(p.bio), label: "Write a short bio", weight: 14 },
    { ok: hasText(p.location), label: "Set your location", weight: 8 },
    { ok: hasText(p.imageUrl || p.image_url), label: "Upload profile photo", weight: 12 },
    { ok: hasText(p.coverImageUrl || p.cover_image_url || p.cover), label: "Upload cover photo", weight: 8 },
    { ok: normalizeArray(p.skills).length >= 3, label: "Add at least 3 skills", weight: 14 },
    { ok: hasText(p.company) || hasText(p.currentRole), label: "Add work experience", weight: 10 },
    { ok: hasText(p.school) || hasText(p.degree), label: "Add education details", weight: 5 },
    { ok: hasText(p.website), label: "Add a portfolio link", weight: 5 },
  ];

  const total = fields.reduce((sum, f) => sum + f.weight, 0);
  const complete = fields.reduce((sum, f) => sum + (f.ok ? f.weight : 0), 0);
  const score = Math.max(0, Math.min(100, Math.round((complete / total) * 100)));
  const missing = fields.filter((f) => !f.ok).map((f) => f.label);

  const tier = score >= 85 ? "Elite" : score >= 65 ? "Strong" : score >= 45 ? "Rising" : "Starter";

  return { score, tier, missing, completedItems: fields.filter((f) => f.ok).length, totalItems: fields.length };
}

export function computeJobMatch(job: AnyRecord, profile: AnyRecord | null | undefined) {
  const skills = new Set(
    normalizeArray(profile?.skills).map((skill) => skill.toLowerCase()),
  );
  const location = String(profile?.location || "").toLowerCase();
  const headline = String(profile?.headline || "").toLowerCase();

  const rawJobSkills = normalizeArray(job?.skills);
  const jobSkills = rawJobSkills.map((s) => s.toLowerCase());
  const shared = jobSkills.filter((s) => skills.has(s));

  const skillsScore =
    jobSkills.length > 0 ? Math.min(70, Math.round((shared.length / jobSkills.length) * 70)) : 25;
  const locationScore =
    location && String(job?.location || "").toLowerCase().includes(location) ? 15 : 0;
  const roleScore =
    headline && String(job?.title || "").toLowerCase().includes(headline.split(" ")[0] || "") ? 15 : 0;

  const score = Math.max(25, Math.min(99, skillsScore + locationScore + roleScore));

  const reasons: string[] = [];
  if (shared.length > 0) reasons.push(`${shared.length} shared skill${shared.length > 1 ? "s" : ""}`);
  if (locationScore > 0) reasons.push("location aligned");
  if (roleScore > 0) reasons.push("title aligned");
  if (reasons.length === 0) reasons.push("recommended for your activity");

  return { score, reasons };
}
