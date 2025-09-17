// app/dashboard/layout.tsx
"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  
  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  // Redirect if not authenticated
  if (!session) {
    redirect("/auth/signin");
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}