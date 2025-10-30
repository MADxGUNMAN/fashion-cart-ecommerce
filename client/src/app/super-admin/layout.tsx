"use client";

import SuperAdminSidebar from "@/components/super-admin/sidebar";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import { useState } from "react";

function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
