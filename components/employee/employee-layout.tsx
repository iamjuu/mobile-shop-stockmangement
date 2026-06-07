import { ReactNode } from "react";

import { EmployeeSidebar } from "./employee-sidebar";
import { EmployeeHeader } from "./employee-header";

interface Props {
  children: ReactNode;
}

export function EmployeeLayout({
  children,
}: Props) {
  return (
    <div className="flex">
      <EmployeeSidebar />

      <div className="flex-1">
        <EmployeeHeader />

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}