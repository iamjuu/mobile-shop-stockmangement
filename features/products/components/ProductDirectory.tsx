"use client";

import { useMemo, useRef, useState } from "react";
import { Download, Printer, X } from "lucide-react";

import { QRPreview } from "./QRPreview";

interface ProductDirectoryItem {
  id: string;
  productCode: string;
  productName: string;
  shopName: string;
  categoryName: string;
  subcategoryName: string;
  purchasePrice?: number | null;
  price: number;
  stock: number;
  description?: string | null;
}

interface ProductDirectoryProps {
  products: ProductDirectoryItem[];
}

const currency = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  style: "currency",
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function ProductDirectory({
  products,
}: ProductDirectoryProps) {
  const [selectedProduct, setSelectedProduct] =
    useState<ProductDirectoryItem | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const qrValue = useMemo(() => {
    if (!selectedProduct) {
      return "";
    }

    return JSON.stringify({
      code: selectedProduct.productCode,
      name: selectedProduct.productName,
      shop: selectedProduct.shopName,
      category: selectedProduct.categoryName,
      subcategory: selectedProduct.subcategoryName,
      purchasePrice: selectedProduct.purchasePrice ?? 0,
      price: selectedProduct.price,
      profitPerSale: selectedProduct.price - (selectedProduct.purchasePrice ?? 0),
      stock: selectedProduct.stock,
    });
  }, [selectedProduct]);

  function getQrSvgMarkup() {
    const svg = qrRef.current?.querySelector("svg");

    if (!svg) {
      return null;
    }

    return new XMLSerializer().serializeToString(svg);
  }

  function handleDownloadQr() {
    if (!selectedProduct) {
      return;
    }

    const svgMarkup = getQrSvgMarkup();

    if (!svgMarkup) {
      return;
    }

    const blob = new Blob([svgMarkup], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${selectedProduct.productCode}-qr.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function handlePrintQr() {
    if (!selectedProduct) {
      return;
    }

    const svgMarkup = getQrSvgMarkup();

    if (!svgMarkup) {
      return;
    }

    const printWindow = window.open("", "_blank", "width=520,height=720");

    if (!printWindow) {
      return;
    }

    const productName = escapeHtml(selectedProduct.productName);
    const productCode = escapeHtml(selectedProduct.productCode);
    const shopName = escapeHtml(selectedProduct.shopName);
    const categoryName = escapeHtml(selectedProduct.categoryName);
    const subcategoryName = escapeHtml(selectedProduct.subcategoryName);
    const purchasePrice = escapeHtml(
      currency.format(selectedProduct.purchasePrice ?? 0)
    );
    const price = escapeHtml(currency.format(selectedProduct.price));
    const profit = escapeHtml(
      currency.format(selectedProduct.price - (selectedProduct.purchasePrice ?? 0))
    );

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${productCode} QR</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 32px;
              color: #09090b;
            }
            .card {
              border: 1px solid #d4d4d8;
              border-radius: 18px;
              padding: 24px;
              max-width: 380px;
            }
            .qr {
              display: flex;
              justify-content: center;
              margin: 20px 0;
            }
            h1 {
              font-size: 22px;
              margin: 0 0 6px;
            }
            p {
              margin: 6px 0;
              font-size: 14px;
            }
            strong {
              color: #52525b;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${productName}</h1>
            <p><strong>Code:</strong> ${productCode}</p>
            <div class="qr">${svgMarkup}</div>
            <p><strong>Shop:</strong> ${shopName}</p>
            <p><strong>Category:</strong> ${categoryName}</p>
            <p><strong>Subcategory:</strong> ${subcategoryName}</p>
            <p><strong>Purchase Price:</strong> ${purchasePrice}</p>
            <p><strong>Selling Price:</strong> ${price}</p>
            <p><strong>Profit Per Sale:</strong> ${profit}</p>
            <p><strong>Stock:</strong> ${selectedProduct.stock} units</p>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <>
      <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">
              Product directory
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {products.length} products configured
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Shop</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Subcategory</th>
                <th className="px-5 py-4">Purchase</th>
                <th className="px-5 py-4">Selling</th>
                <th className="px-5 py-4">Profit</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 text-sm">
              {products.length > 0 ? (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className="cursor-pointer transition hover:bg-zinc-50"
                    onClick={() => {
                      setSelectedProduct(product);
                    }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold text-white">
                          {product.productName.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-zinc-950">
                            {product.productName}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {product.productCode}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-zinc-700">
                      {product.shopName}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                        {product.categoryName}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-zinc-700">
                      {product.subcategoryName}
                    </td>
                    <td className="px-5 py-4 text-zinc-700">
                      {currency.format(product.purchasePrice ?? 0)}
                    </td>
                    <td className="px-5 py-4 font-medium text-zinc-950">
                      {currency.format(product.price)}
                    </td>
                    <td className="px-5 py-4 font-medium text-emerald-700">
                      {currency.format(product.price - (product.purchasePrice ?? 0))}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          product.stock <= 5
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {product.stock} units
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedProduct(product);
                        }}
                      >
                        QR
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-12 text-center text-sm text-zinc-500"
                  >
                    No products found. Add shops, categories, and subcategories first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedProduct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-5">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Product QR details
                </p>
                <h3 className="mt-1 text-2xl font-semibold">
                  {selectedProduct.productName}
                </h3>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 hover:bg-zinc-50"
                onClick={() => {
                  setSelectedProduct(null);
                }}
                aria-label="Close product QR"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 p-5 md:grid-cols-[260px_1fr]">
              <div className="flex flex-col items-center justify-center rounded-[24px] bg-zinc-50 p-6">
                <div
                  ref={qrRef}
                  className="rounded-2xl bg-white p-4"
                >
                  <QRPreview value={qrValue} />
                </div>
                <p className="mt-4 text-center text-xs font-medium text-zinc-500">
                  Scan to read product details
                </p>
                <div className="mt-5 grid w-full grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-4 py-3 text-xs font-semibold text-white hover:bg-zinc-800"
                    onClick={handleDownloadQr}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                    onClick={handlePrintQr}
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  ["Product Code", selectedProduct.productCode],
                  ["Shop", selectedProduct.shopName],
                  ["Category", selectedProduct.categoryName],
                  ["Subcategory", selectedProduct.subcategoryName],
                  ["Purchase Price", currency.format(selectedProduct.purchasePrice ?? 0)],
                  ["Selling Price", currency.format(selectedProduct.price)],
                  [
                    "Profit Per Sale",
                    currency.format(
                      selectedProduct.price - (selectedProduct.purchasePrice ?? 0)
                    ),
                  ],
                  ["Stock", `${selectedProduct.stock} units`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-zinc-50 px-4 py-3"
                  >
                    <span className="text-sm text-zinc-500">{label}</span>
                    <span className="text-right text-sm font-semibold text-zinc-950">
                      {value}
                    </span>
                  </div>
                ))}

                {selectedProduct.description ? (
                  <div className="rounded-2xl bg-zinc-50 px-4 py-3">
                    <p className="text-sm text-zinc-500">Description</p>
                    <p className="mt-1 text-sm font-medium text-zinc-950">
                      {selectedProduct.description}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
