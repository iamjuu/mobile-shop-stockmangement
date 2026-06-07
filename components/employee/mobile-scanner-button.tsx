"use client";

import { ScanLine } from "lucide-react";

interface Props {
  onScanClick?: () => void;
}

export function MobileScannerButton({
  onScanClick,
}: Props) {
  return (
    <button
      onClick={onScanClick}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white"
    >
      <ScanLine size={18} />
      Scan Product
    </button>
  );
}