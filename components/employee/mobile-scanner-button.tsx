"use client";

import { ScanLine } from "lucide-react";

export function MobileScannerButton() {
  const handleScan = () => {
    const value = window.prompt(
      "Scan or paste the product QR data"
    );

    if (!value?.trim()) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("employee-product-scan", {
        detail: value.trim(),
      })
    );
  };

  return (
    <button
      onClick={handleScan}
      className="flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
    >
      <ScanLine size={18} />
      Scan Product
    </button>
  );
}
