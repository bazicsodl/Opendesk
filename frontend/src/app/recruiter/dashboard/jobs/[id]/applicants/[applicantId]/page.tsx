import { redirect } from "next/navigation";

export default async function RecruiterDashboardApplicantRedirectPage({
  params,
}: {
  params: Promise<{ applicantId: string }>;
}) {
  const { applicantId } = await params;
  redirect(`/recruiter/applicants/${applicantId}`);
}

