import { ReactNode } from "react";

import { EmployeeSidebar } from "./employee-sidebar";
import { EmployeeHeader } from "./employee-header";

interface Props {
  children: ReactNode;
  userName: string;
}

export function EmployeeLayout({
  children,
  userName,
}: Props) {
  return (
    <div className="min-h-screen bg-[#f4f2eb] text-zinc-950">
      <EmployeeSidebar />
      <EmployeeHeader userName={userName} />

      <main className="w-full px-3 py-4 sm:p-[10px]">
        {children}
      </main>
    </div>
  );
}
