import { ReactNode } from "react";

import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";

interface Props {
  children: ReactNode;
}

export function AdminLayout({
  children,
}: Props) {
  return (
    <div className="min-h-screen bg-[#f4f2eb] text-zinc-950">
      <AdminSidebar />
      <AdminHeader />

      <main className="w-full p-[10px]">
        {children}
      </main>
    </div>
  );
}
