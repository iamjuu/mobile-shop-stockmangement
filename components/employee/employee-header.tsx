"use client";

import { UserButton } from "@clerk/nextjs";

import { MobileScannerButton } from "./mobile-scanner-button";

export function EmployeeHeader() {
  const handleScan = () => {
    console.log("Open scanner");
  };

  return (
    <header className="h-16 border-b bg-white px-6 flex items-center justify-between">
      <h1 className="font-semibold">
        Employee Dashboard
      </h1>

      <div className="flex items-center gap-4">
        <MobileScannerButton
          onScanClick={handleScan}
        />

        <UserButton />
      </div>
    </header>
  );
}