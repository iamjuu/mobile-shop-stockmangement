"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { employeeNavItems } from "@/components/navigation/employee-nav";

export function EmployeeSidebar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-[#f4f2eb]/95 p-[10px] backdrop-blur">
      <div className="flex w-full flex-col gap-4 lg:flex-row lg:justify-between">
        <Link
          href="/employee/dashboard"
          className="inline-flex w-fit items-center rounded-full border border-zinc-300 bg-white px-4 py-2 text-xl font-semibold"
        >
          Employee Panel
        </Link>

        <nav className="flex gap-2 overflow-x-auto rounded-full bg-white/70 p-1">
          {employeeNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-700 hover:bg-white hover:text-zinc-950"
                }`}
              >
                <Icon size={16} />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
