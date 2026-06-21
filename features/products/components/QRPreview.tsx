"use client";

import QRCode from "react-qr-code";

export function QRPreview({
  productCode,
  value,
}: {
  productCode?: string;
  value?: string;
}) {
  return (
    <QRCode
      value={value ?? productCode ?? ""}
      size={180}
    />
  );
}
