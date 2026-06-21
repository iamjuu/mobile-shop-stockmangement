"use client";

import { useEffect } from "react";

import JsBarcode from "jsbarcode";

export function BarcodePreview({
  productCode,
}: {
  productCode: string;
}) {
  useEffect(() => {
    JsBarcode(
      "#barcode",
      productCode
    );
  }, [productCode]);

  return <svg id="barcode" />;
}