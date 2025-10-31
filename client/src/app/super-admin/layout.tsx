"use client";

import SuperAdminSidebar from "@/components/super-admin/sidebar";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated and has SUPER_ADMIN role
    if (!user || user.role !== "SUPER_ADMIN") {
      router.push("/auth/login");
    }
  }, [user, router]);

  // Show loading or redirect if not authorized
  if (!user || user.role !== "SUPER_ADMIN") {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SuperAdminSidebar
        isOpen={isSidebarOpen}
        toggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div
        className={cn(
          "transition-all duration-300 flex-grow flex flex-col",
          isSidebarOpen ? "ml-64" : "ml-16",
          "min-h-screen"
        )}
      >
        <main className="flex-grow">{children}</main>
        <Footer />
      </div>
    </div>
  );
}

export default SuperAdminLayout;
