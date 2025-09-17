import MarketDataDashboard from "@/components/dashboard/MarketdataDashboard";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <DashboardLayout>
      <MarketDataDashboard />
    </DashboardLayout>
  );
}