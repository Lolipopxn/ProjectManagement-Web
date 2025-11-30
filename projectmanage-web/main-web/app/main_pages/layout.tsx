"use client";

import Navbar from "../components/Nabbar_main/Navbar";
import Sidebar from "../components/Sidebar";
import { useSidebarStore } from "@/hooks/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isNavOpen } = useSidebarStore();

  return (
    <section>
      <div className="flex flex-col overflow-hidden">
        {/*Navbar-Top*/}
        <Navbar />

        <div className={`flex flex-row gap-2 mt-17 overflow-y-auto ${isNavOpen ? 'transition-all duration-500 md:ml-65' : 'transition-all duration-500 md:ml-20'}`}>
          {/*Content*/}
          {children}
        </div>

        {/*Navbar-left*/}
          <div className={`shrink-0 md:flex`}>
            <Sidebar />
          </div>

      </div>
    </section>
  );
}
