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
    <div className="flex">
      <AdminSidebar />

      <div className="flex-1">
        <AdminHeader />

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}