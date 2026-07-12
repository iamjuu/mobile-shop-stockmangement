"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import Image from "next/image";

import { adminNavItems } from "@/components/navigation/admin-nav";

// FIX: Point to the root '/' which automatically refers to the public folder.
const Logo = "/images/stock logo.png";

export function AdminSidebar() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-[#f4f2eb]/95 px-3 py-2 backdrop-blur">
      <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <Link
          href="/admin/admin-dashboard"
          className="flex items-center justify-center"
        >
          <Image
            className="w-[200px] object-contain"
            src={Logo}
            alt="Logo"
            width={100}
            height={100}
          />
        </Link>
        <nav className="scrollbar-hover flex gap-1 overflow-x-auto rounded-full bg-white/70 p-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isPending =
              pendingHref === item.href && pendingHref !== pathname;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                aria-disabled={isPending}
                onClick={() => {
                  if (!isActive) setPendingHref(item.href);
                }}
                className={`flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition ${
                  isActive || isPending
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-700 hover:bg-white hover:text-zinc-950"
                }`}
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Icon size={16} />
                )}
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
