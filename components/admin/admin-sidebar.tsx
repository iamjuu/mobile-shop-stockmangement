"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminNavItems } from "@/components/navigation/admin-nav";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-white h-screen">
      <div className="h-16 flex items-center px-6 border-b">
        <h2 className="font-bold text-lg">
          Inventory POS
        </h2>
      </div>

      <nav className="p-4 space-y-2">
        {adminNavItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition
                ${
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