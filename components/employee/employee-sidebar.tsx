"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { employeeNavItems } from "@/components/navigation/employee-nav";

export function EmployeeSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r h-screen bg-white">
      <div className="h-16 flex items-center px-6 border-b">
        <h2 className="font-bold">
          Employee Panel
        </h2>
      </div>

      <nav className="p-4 space-y-2">
        {employeeNavItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                pathname === item.href
                  ? "bg-black text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              <Icon size={18} />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}