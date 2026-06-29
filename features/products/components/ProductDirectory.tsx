"use client";

import { useMemo, useRef, useState } from "react";
import { Download, Loader2, Pencil, Plus, Printer, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { ActionButton } from "@/components/action-button";
import { TablePagination } from "@/components/table-pagination";

import { QRPreview } from "./QRPreview";

interface ProductDirectoryItem {
  id: string;
  productCode: string;
  productName: string;
  source?: "REGULAR" | "EXCHANGE_THIRD_PARTY";
  shopName: string;
  categoryName: string;
  subcategoryName: string;
  purchasePrice?: number | null;
  price: number;
  stock: number;
  mainImageUrl?: string | null;
  galleryImageUrls?: string[];
  description?: string | null;
}

type ProductDirectoryRow = ProductDirectoryItem & {
  recordCount: number;
};

interface ProductDirectoryProps {
  products: ProductDirectoryItem[];
  updateAction: (
    productId: string,
    data: {
      productName: string;
      purchasePrice: number;
      price: number;
      stock: number;
      description?: string;
    }
  ) => Promise<{
    ok: boolean;
    message: string;
  }>;
  deleteAction: (productId: string) => Promise<{
    ok: boolean;
    message: string;
  }>;
  duplicateAction: (productId: string) => Promise<{
    ok: boolean;
    message: string;
    product?: ProductDirectoryItem;
  }>;
}

const currency = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  style: "currency",
});
const PAGE_SIZE = 7;

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
  updateAction,
  deleteAction,
  duplicateAction,
}: ProductDirectoryProps) {
  const router = useRouter();
  const [localProducts, setLocalProducts] = useState(products);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductDirectoryItem | null>(null);
  const [editProduct, setEditProduct] =
    useState<ProductDirectoryItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [duplicatingProductId, setDuplicatingProductId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] =
    useState<"ALL" | "REGULAR" | "EXCHANGE_THIRD_PARTY">("REGULAR");
  const [currentPage, setCurrentPage] = useState(1);
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
  const visibleProducts = useMemo(
    () => {
      const filteredProducts = localProducts.filter(
        (product) =>
          sourceFilter === "ALL" ||
          (product.source ?? "REGULAR") === sourceFilter
      );
      const groupedProducts = new Map<string, ProductDirectoryRow>();

      filteredProducts.forEach((product) => {
        const source = product.source ?? "REGULAR";
        const groupKey =
          source === "EXCHANGE_THIRD_PARTY"
            ? product.id
            : [
                source,
                product.productName.trim().toLowerCase(),
                product.shopName,
                product.categoryName,
                product.subcategoryName,
                product.purchasePrice ?? 0,
                product.price,
                product.mainImageUrl ?? "",
                product.description ?? "",
              ].join("|");
        const existingProduct = groupedProducts.get(groupKey);

        if (!existingProduct) {
          groupedProducts.set(groupKey, {
            ...product,
            recordCount: 1,
          });
          return;
        }

        const shouldUseThisProduct =
          existingProduct.stock <= 0 && product.stock > 0;

        groupedProducts.set(groupKey, {
          ...(shouldUseThisProduct ? product : existingProduct),
          stock: existingProduct.stock + product.stock,
          recordCount: existingProduct.recordCount + 1,
        });
      });

      return Array.from(groupedProducts.values());
    },
    [localProducts, sourceFilter]
  );
  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(
    () =>
      visibleProducts.slice(
        (safeCurrentPage - 1) * PAGE_SIZE,
        safeCurrentPage * PAGE_SIZE
      ),
    [safeCurrentPage, visibleProducts]
  );

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
    setSelectedProduct(null);
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
            <p><strong>Brand:</strong> ${subcategoryName}</p>
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
    setSelectedProduct(null);
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => {
      setToast(null);
    }, 2500);
  }

  function handleOpenProductQr(product: ProductDirectoryItem) {
    if (product.stock <= 0) {
      showToast("Out of stock.");
      return;
    }

    setSelectedProduct(product);
  }

  async function handleDelete(product: ProductDirectoryItem) {
    const ok = window.confirm(
      `Delete ${product.productName}? This action cannot be undone.`
    );

    if (!ok) {
      return;
    }

    setDeletingProductId(product.id);

    try {
      const result = await deleteAction(product.id);
      showToast(result.message);

      if (result.ok) {
        setLocalProducts((currentProducts) =>
          currentProducts.filter(
            (currentProduct) => currentProduct.id !== product.id
          )
        );
        setSelectedProduct((currentProduct) =>
          currentProduct?.id === product.id ? null : currentProduct
        );
        setEditProduct((currentProduct) =>
          currentProduct?.id === product.id ? null : currentProduct
        );
        router.refresh();
      }
    } finally {
      setDeletingProductId(null);
    }
  }

  async function handleDuplicateProduct(product: ProductDirectoryItem) {
    if ((product.source ?? "REGULAR") !== "REGULAR") {
      showToast("Only regular products can be added this way.");
      return;
    }

    setDuplicatingProductId(product.id);

    try {
      const result = await duplicateAction(product.id);
      showToast(result.message);

      if (result.ok && result.product) {
        setLocalProducts((currentProducts) => [
          result.product as ProductDirectoryItem,
          ...currentProducts,
        ]);
        setSourceFilter("REGULAR");
        setSelectedProduct(result.product);
        router.refresh();
      }
    } finally {
      setDuplicatingProductId(null);
    }
  }

  async function handleUpdate(formData: FormData) {
    if (!editProduct) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedProduct = {
        productName: String(formData.get("productName") ?? ""),
        purchasePrice: Number(formData.get("purchasePrice") ?? 0),
        price: Number(formData.get("price") ?? 0),
        stock: Number(formData.get("stock") ?? 0),
        description: String(formData.get("description") ?? ""),
      };
      const result = await updateAction(editProduct.id, updatedProduct);

      showToast(result.message);

      if (result.ok) {
        setLocalProducts((currentProducts) =>
          currentProducts.map((product) =>
            product.id === editProduct.id
              ? {
                  ...product,
                  ...updatedProduct,
                  productName: updatedProduct.productName.trim(),
                  stock: Math.trunc(updatedProduct.stock),
                  description: updatedProduct.description.trim() || null,
                }
              : product
          )
        );
        setEditProduct(null);
        router.refresh();
      }
    } finally {
      setIsSaving(false);
    }
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
              {visibleProducts.length} products shown
            </p>
          </div>
          <div className="flex rounded-full bg-zinc-100 p-1">
            {[
              ["ALL", "All"],
              ["REGULAR", "Regular"],
              ["EXCHANGE_THIRD_PARTY", "Exchange"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setCurrentPage(1);
                  setSourceFilter(
                    value as "ALL" | "REGULAR" | "EXCHANGE_THIRD_PARTY"
                  );
                }}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  sourceFilter === value
                    ? "bg-zinc-950 text-white"
                    : "text-zinc-600 hover:bg-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="scrollbar-hover overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Shop</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Brand</th>
                <th className="px-5 py-4">Purchase</th>
                <th className="px-5 py-4">Selling</th>
                <th className="px-5 py-4">Profit</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 text-sm">
              {visibleProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={`transition hover:bg-zinc-50 ${
                      product.stock <= 0
                        ? "cursor-not-allowed opacity-70"
                        : "cursor-pointer"
                    }`}
                    onClick={() => {
                      handleOpenProductQr(product);
                    }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {product.mainImageUrl ? (
                          <div className="size-12 shrink-0 overflow-hidden rounded-full bg-zinc-100">
                            <Image
                              src={product.mainImageUrl}
                              alt={product.productName}
                              width={48}
                              height={48}
                              unoptimized
                              className="size-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold text-white">
                            {product.productName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-zinc-950">
                            {product.productName}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <p className="text-xs text-zinc-500">
                              {product.productCode}
                            </p>
                            {product.recordCount > 1 ? (
                              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600">
                                {product.recordCount} records
                              </span>
                            ) : null}
                            {(product.source ?? "REGULAR") ===
                            "EXCHANGE_THIRD_PARTY" ? (
                              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                                Exchange Third Party
                              </span>
                            ) : null}
                          </div>
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
                            ? product.stock <= 0
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {product.stock} units
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {(product.source ?? "REGULAR") === "REGULAR" ? (
                          <button
                            type="button"
                            disabled={duplicatingProductId === product.id}
                            aria-busy={duplicatingProductId === product.id}
                            className="inline-flex items-center gap-1 rounded-full border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDuplicateProduct(product);
                            }}
                          >
                            {duplicatingProductId === product.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Plus className="h-3.5 w-3.5" />
                            )}
                            Add Product
                          </button>
                        ) : null}
                        <button
                          type="button"
                          aria-disabled={product.stock <= 0}
                          className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                            product.stock <= 0
                              ? "cursor-not-allowed border-zinc-200 text-zinc-400"
                              : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                          }`}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenProductQr(product);
                          }}
                        >
                          QR
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                          onClick={(event) => {
                            event.stopPropagation();
                            setEditProduct(product);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          
                        </button>
                        <button
                          type="button"
                          disabled={deletingProductId === product.id}
                          aria-busy={deletingProductId === product.id}
                          className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-zinc-400"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(product);
                          }}
                        >
                          {deletingProductId === product.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-12 text-center text-sm text-zinc-500"
                  >
                    No products found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          currentPage={safeCurrentPage}
          pageSize={PAGE_SIZE}
          totalItems={visibleProducts.length}
          onPageChange={setCurrentPage}
        />
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
                {selectedProduct.mainImageUrl ? (
                  <Image
                    src={selectedProduct.mainImageUrl}
                    alt={selectedProduct.productName}
                    width={180}
                    height={180}
                    unoptimized
                    className="mb-5 aspect-square w-full max-w-[180px] rounded-3xl object-cover"
                  />
                ) : null}
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
                  <ActionButton
                    onAction={handleDownloadQr}
                    loadingLabel="Downloading..."
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-4 py-3 text-xs font-semibold text-white hover:bg-zinc-800"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </ActionButton>
                  <ActionButton
                    onAction={handlePrintQr}
                    loadingLabel="Preparing..."
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </ActionButton>
                </div>
              </div>

              <div className="space-y-3">
                {selectedProduct.galleryImageUrls?.length ? (
                  <div className="grid grid-cols-3 gap-3">
                    {selectedProduct.galleryImageUrls.map((imageUrl, index) => (
                      <Image
                        key={imageUrl}
                        src={imageUrl}
                        alt={`${selectedProduct.productName} ${index + 1}`}
                        width={120}
                        height={120}
                        unoptimized
                        className="aspect-square rounded-2xl object-cover"
                      />
                    ))}
                  </div>
                ) : null}

                {[
                  ["Product Code", selectedProduct.productCode],
                  [
                    "Source",
                    (selectedProduct.source ?? "REGULAR") ===
                    "EXCHANGE_THIRD_PARTY"
                      ? "Exchange Third Party"
                      : "Regular",
                  ],
                  ["Shop", selectedProduct.shopName],
                  ["Category", selectedProduct.categoryName],
                  ["Brand", selectedProduct.subcategoryName],
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

      {editProduct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-5">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Edit product
                </p>
                <h3 className="mt-1 text-2xl font-semibold">
                  {editProduct.productName}
                </h3>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 hover:bg-zinc-50"
                onClick={() => {
                  setEditProduct(null);
                }}
                aria-label="Close edit product"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              action={handleUpdate}
              className="space-y-4 p-5"
            >
              <div>
                <label
                  htmlFor="editProductName"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Product name
                </label>
                <input
                  id="editProductName"
                  name="productName"
                  defaultValue={editProduct.productName}
                  required
                  className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="editPurchasePrice"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Purchase price
                  </label>
                  <input
                    id="editPurchasePrice"
                    name="purchasePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={editProduct.purchasePrice ?? 0}
                    required
                    className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label
                    htmlFor="editPrice"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Selling price
                  </label>
                  <input
                    id="editPrice"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={editProduct.price}
                    required
                    className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label
                    htmlFor="editStock"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Stock
                  </label>
                  <input
                    id="editStock"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={editProduct.stock}
                    required
                    className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="editDescription"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Description
                </label>
                <textarea
                  id="editDescription"
                  name="description"
                  rows={3}
                  defaultValue={editProduct.description ?? ""}
                  className="w-full resize-none rounded-3xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
                  onClick={() => {
                    setEditProduct(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  aria-busy={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-5 right-5 z-[60] rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      ) : null}
    </>
  );
}
