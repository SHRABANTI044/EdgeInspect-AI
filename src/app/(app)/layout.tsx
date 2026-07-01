import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import AnimatedBackground from "@/components/AnimatedBackground";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  if (!session) return redirect("/login");

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AnimatedBackground />
      <div className="flex overflow-x-hidden">
        <Sidebar userName={session.name} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 px-4 py-6 lg:px-7">{children}</main>
        </div>
      </div>
    </div>
  );
}