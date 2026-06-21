"use client";

import { ScanLine } from "lucide-react";

export function MobileScannerButton() {
  const handleScan = () => {
    console.log("Open scanner");
  };

  return (
    <button
      onClick={handleScan}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white"
    >
      <ScanLine size={18} />
      Scan Product
    </button>
  );
}
