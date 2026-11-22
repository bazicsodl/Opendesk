import ResetPasswordClient from "./ResetPasswordClient";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  return <ResetPasswordClient params={resolvedParams} />;
}
