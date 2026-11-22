import { redirect } from "next/navigation";

export default async function RecruiterJobByIdRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/recruiter/dashboard/jobs/${id}`);
}

