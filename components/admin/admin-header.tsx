"use client";

import { UserButton } from "@clerk/nextjs";

export function AdminHeader() {
  return (
    <header className="h-16 border-b bg-white px-6 flex items-center justify-between">
      <h1 className="font-semibold text-xl">
        Admin Dashboard
      </h1>

      <UserButton />
    </header>
  );
}