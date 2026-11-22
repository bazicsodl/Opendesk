import RecruiterSidebar from "../components/RecruiterSidebar";
import RecruiterTopbar from "../components/RecruiterTopbar";

export default function RecruiterDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f8f5]">
      <RecruiterSidebar />

      <div className="ml-64">
        <RecruiterTopbar />
        <main className="pt-20 p-6">{children}</main>
      </div>
    </div>
  );
}
