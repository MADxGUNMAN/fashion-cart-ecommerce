"use client";

import { usePathname } from "next/navigation";
import Header from "../user/header";
import Footer from "../Footer";

const pathsNotToShowHeaders = ["/auth", "/super-admin"];

function CommonLayout({ children }: { children: React.ReactNode }) {
  const pathName = usePathname();

  const showHeader = !pathsNotToShowHeaders.some((currentPath) =>
    pathName.startsWith(currentPath)
  );

  // Show footer on auth pages but not on super-admin (since admin has its own footer)
  const showFooter = !pathName.startsWith("/super-admin");

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {showHeader && <Header />}
      <main className="flex-grow">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}

export default CommonLayout;
