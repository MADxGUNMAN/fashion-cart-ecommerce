"use client";

import SuperAdminSidebar from "@/components/super-admin/sidebar";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Give some time for the store to hydrate from localStorage
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Check if user is authenticated and has SUPER_ADMIN role
      if (!user || user.role !== "SUPER_ADMIN") {
        console.log("No user or not SUPER_ADMIN, redirecting to login");
        router.push("/auth/login");
      } else {
        console.log("User authenticated as SUPER_ADMIN:", user);
      }
    }, 1000); // Wait 1 second for store to hydrate

    return () => clearTimeout(timer);
  }, [user, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // Show loading or redirect if not authorized
  if (!user || user.role !== "SUPER_ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Redirecting...</div>
      </div>
    );
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
