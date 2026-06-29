"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { employeeNavItems } from "@/components/navigation/employee-nav";

export function EmployeeSidebar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-[#f4f2eb]/95 px-3 py-2 backdrop-blur sm:p-[10px]">
      <div className="flex w-full flex-col gap-3 lg:flex-row lg:justify-between">
        <Link
          href="/employee/dashboard"
          className="inline-flex w-fit items-center rounded-full border border-zinc-300 bg-white px-4 py-2 text-base font-semibold sm:text-xl"
        >
          Employee Panel
        </Link>

        <nav className="scrollbar-hover -mx-1 flex gap-2 overflow-x-auto rounded-full bg-white/70 p-1">
          {employeeNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition sm:px-4 ${
                  isActive
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-700 hover:bg-white hover:text-zinc-950"
                }`}
              >
                <Icon size={16} />
                <span className="whitespace-nowrap">{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
