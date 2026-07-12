"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, Loader2, QrCode, ReceiptText, X } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import { QRPreview } from "./QRPreview";

interface ShopOption {
  id: string;
  shopName: string;
}

interface BillingProduct {
  id: string;
  productCode: string;
  productName: string;
  shopId: string;
  shopName: string;
  categoryId: string;
  categoryName: string;
  subcategoryName: string;
  price: number;
  stock: number;
  mainImageUrl?: string | null;
  description?: string | null;
}

interface SaleBill {
  invoiceNo: string;
  date: string;
  employeeName: string;
  employeeEmail: string;
  shopName: string;
  shopCode: string;
  shopAddress?: string | null;
  shopPhone?: string | null;
  productCode: string;
  productName: string;
  categoryName: string;
  subcategoryName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
  totalAmount: number;
  proofNumber?: string | null;
}

interface EmployeeBillingClientProps {
  shops: ShopOption[];
  products: BillingProduct[];
  saleAction: (formData: FormData) => Promise<{
    success: boolean;
    bill?: SaleBill;
  }>;
}

const currency = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  style: "currency",
});
function getProductCodeFromScan(value: string) {
  try {
    const parsed = JSON.parse(value) as {
      code?: string;
      productCode?: string;
    };

    return parsed.code ?? parsed.productCode ?? value;
  } catch {
    return value;
  }
}

function createQrValue(product: BillingProduct) {
  return JSON.stringify({
    code: product.productCode,
    name: product.productName,
    shop: product.shopName,
    category: product.categoryName,
    subcategory: product.subcategoryName,
    price: product.price,
    stock: product.stock,
  });
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatBillDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createBillHtml(bill: SaleBill) {
  const invoiceNo = escapeHtml(bill.invoiceNo);
  const rows = [
    ["Product", bill.productName],
    ["Product code", bill.productCode],
    ["Category", bill.categoryName],
    ["Brand", bill.subcategoryName],
    ["Quantity", bill.quantity],
    ["Unit price", currency.format(bill.unitPrice)],
    ["Subtotal", currency.format(bill.subtotal)],
    ["Discount", currency.format(bill.discount)],
    ["Total amount", currency.format(bill.totalAmount)],
    ["Proof number", bill.proofNumber || "Not provided"],
  ];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bill ${invoiceNo}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f4f4f5; color: #18181b; font-family: Arial, sans-serif; }
    .page { max-width: 760px; margin: 24px auto; background: #fff; padding: 32px; border: 1px solid #e4e4e7; }
    .top { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #18181b; padding-bottom: 20px; }
    h1 { margin: 0; font-size: 26px; letter-spacing: 0; }
    h2 { margin: 28px 0 12px; font-size: 15px; text-transform: uppercase; color: #52525b; }
    p { margin: 5px 0; font-size: 13px; color: #52525b; }
    .right { text-align: right; }
    .badge { display: inline-block; margin-top: 8px; border-radius: 999px; background: #dcfce7; color: #166534; padding: 6px 12px; font-size: 12px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 14px; }
    th, td { border-bottom: 1px solid #e4e4e7; padding: 12px 8px; text-align: left; }
    th { color: #71717a; font-size: 12px; text-transform: uppercase; }
    td:last-child, th:last-child { text-align: right; font-weight: 700; }
    .total { margin-top: 18px; margin-left: auto; width: 320px; }
    .total div { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #e4e4e7; font-size: 14px; }
    .total .payable { font-size: 18px; font-weight: 800; border-bottom: 0; }
    .footer { margin-top: 36px; display: flex; justify-content: space-between; gap: 20px; color: #71717a; font-size: 12px; }
    @media print {
      body { background: #fff; }
      .page { margin: 0; max-width: none; border: 0; }
    }
  </style>
</head>
<body>
  <main class="page">
    <section class="top">
      <div>
        <h1>${escapeHtml(bill.shopName)}</h1>
        <p>Shop code: ${escapeHtml(bill.shopCode)}</p>
        ${bill.shopAddress ? `<p>${escapeHtml(bill.shopAddress)}</p>` : ""}
        ${bill.shopPhone ? `<p>Phone: ${escapeHtml(bill.shopPhone)}</p>` : ""}
      </div>
      <div class="right">
        <h1>Bill</h1>
        <p>Invoice: ${invoiceNo}</p>
        <p>Date: ${escapeHtml(formatBillDate(bill.date))}</p>
        <span class="badge">Product sold</span>
      </div>
    </section>

    <h2>Employee Details</h2>
    <p>Name: ${escapeHtml(bill.employeeName)}</p>
    <p>Email: ${escapeHtml(bill.employeeEmail)}</p>

    <h2>Product Details</h2>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            ([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`
          )
          .join("")}
      </tbody>
    </table>

    <div class="total">
      <div><span>Subtotal</span><strong>${escapeHtml(currency.format(bill.subtotal))}</strong></div>
      <div><span>Discount</span><strong>${escapeHtml(currency.format(bill.discount))}</strong></div>
      <div class="payable"><span>Net Amount</span><strong>${escapeHtml(currency.format(bill.totalAmount))}</strong></div>
    </div>

    <section class="footer">
      <span>Thank you for your business.</span>
      <span>${escapeHtml(bill.shopName)}</span>
    </section>
  </main>
</body>
</html>`;
}

function downloadBill(bill: SaleBill) {
  const blob = new Blob([createBillHtml(bill)], {
    type: "text/html;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `bill-${bill.invoiceNo}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function EmployeeBillingClient({
  shops,
  products,
  saleAction,
}: EmployeeBillingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedShopId, setSelectedShopId] = useState(shops[0]?.id ?? "");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [qrProduct, setQrProduct] = useState<BillingProduct | null>(null);
  const [saleProduct, setSaleProduct] = useState<BillingProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [isSelling, setIsSelling] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [latestBill, setLatestBill] = useState<SaleBill | null>(null);
  const saleLockedRef = useRef(false);

  const shopProducts = useMemo(
    () => products.filter((product) => product.shopId === selectedShopId),
    [products, selectedShopId]
  );

  const categoryOptions = useMemo(() => {
    const categoryMap = new Map<string, string>();

    for (const product of shopProducts) {
      categoryMap.set(product.categoryId, product.categoryName);
    }

    return Array.from(categoryMap, ([id, name]) => ({
      id,
      name,
    })).sort((first, second) => first.name.localeCompare(second.name));
  }, [shopProducts]);

  const visibleProducts = useMemo(
    () =>
      selectedCategoryId === "all"
        ? shopProducts
        : shopProducts.filter(
            (product) => product.categoryId === selectedCategoryId
          ),
    [selectedCategoryId, shopProducts]
  );

  const openSaleFromScan = useCallback((scannedValue: string) => {
    const productCode = getProductCodeFromScan(scannedValue).trim();
    const product =
      products.find(
        (item) =>
          item.productCode === productCode &&
          (!selectedShopId || item.shopId === selectedShopId)
      ) ??
      products.find((item) => item.productCode === productCode);

    if (!product) {
      setToast("Product not found.");
      return;
    }

    if (product.stock <= 0) {
      setToast("Out of stock.");
      return;
    }

    setSelectedShopId(product.shopId);
    setSelectedCategoryId(product.categoryId);
    setQrProduct(null);
    setSaleProduct(product);
    setQuantity(1);
    setDiscount(0);
  }, [products, selectedShopId]);

  useEffect(() => {
    function handleScan(event: Event) {
      openSaleFromScan((event as CustomEvent<string>).detail);
    }

    window.addEventListener("employee-product-scan", handleScan);

    return () => {
      window.removeEventListener("employee-product-scan", handleScan);
    };
  }, [openSaleFromScan]);

  useEffect(() => {
    const scannedValue = searchParams.get("scan");

    if (!scannedValue) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      openSaleFromScan(scannedValue);
    }, 0);
    router.replace("/employee/billing", { scroll: false });

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [openSaleFromScan, router, searchParams]);

  function handleOpenProductQr(product: BillingProduct) {
    if (product.stock <= 0) {
      setToast("Out of stock.");
      return;
    }

    setQrProduct(product);
  }

  async function confirmSale(formData: FormData) {
    if (saleLockedRef.current) {
      return;
    }

    if (
      !saleProduct ||
      quantity < 1 ||
      quantity > saleProduct.stock ||
      discount > saleProduct.price * quantity
    ) {
      return;
    }

    saleLockedRef.current = true;
    setIsSelling(true);

    try {
      const soldProduct = saleProduct;
      const soldQuantity = quantity;
      const saleDiscount = discount;

      formData.set("productId", soldProduct.id);
      formData.set("quantity", String(soldQuantity));
      formData.set("discount", String(saleDiscount));
      const result = await saleAction(formData);

      if (!result.success) {
        setToast("Sale could not be completed. Check stock and discount.");
        return;
      }

      setSaleProduct(null);
      setQuantity(1);
      setDiscount(0);
      if (result.bill) {
        setLatestBill(result.bill);
      }
      setToast(
        `Product sold: ${soldProduct.productName} - ${currency.format(
          soldProduct.price * soldQuantity - saleDiscount
        )}`
      );
    } finally {
      saleLockedRef.current = false;
      setIsSelling(false);
    }
  }

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  return (
    <>
      <div className="space-y-4 sm:space-y-5">
        <section className="rounded-[24px] border border-zinc-200 bg-white p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_320px_320px] lg:items-end">
            <div>
              <p className="text-sm font-medium text-zinc-500">
                Billing workflow
              </p>
              <h1 className="mt-1 text-xl font-semibold sm:text-2xl">
                Choose shop and sell products
              </h1>
            </div>

            <div className="w-full">
              <label
                htmlFor="shop"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Shop
              </label>
              <select
                id="shop"
                value={selectedShopId}
                onChange={(event) => {
                  setSelectedShopId(event.target.value);
                  setSelectedCategoryId("all");
                }}
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
              >
                {shops.map((shop) => (
                  <option
                    key={shop.id}
                    value={shop.id}
                  >
                    {shop.shopName}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full">
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Category
              </label>
              <select
                id="category"
                value={selectedCategoryId}
                onChange={(event) => {
                  setSelectedCategoryId(event.target.value);
                }}
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
              >
                <option value="all">All categories</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold">
                Products for sale
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {visibleProducts.length} of {shopProducts.length} products in selected shop
              </p>
            </div>
          </div>

          <div className="divide-y divide-zinc-100 md:hidden">
            {visibleProducts.length > 0 ? (
              visibleProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  disabled={product.stock <= 0}
                  className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70"
                  onClick={() => {
                    handleOpenProductQr(product);
                  }}
                >
                  {product.mainImageUrl ? (
                    <div className="size-14 shrink-0 overflow-hidden rounded-2xl bg-zinc-100">
                      <Image
                        src={product.mainImageUrl}
                        alt={product.productName}
                        width={56}
                        height={56}
                        unoptimized
                        className="size-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-sm font-semibold text-white">
                      {product.productName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-zinc-950">
                          {product.productName}
                        </p>
                        <p className="mt-1 truncate text-xs text-zinc-500">
                          {product.productCode}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                          product.stock <= 0
                            ? "bg-red-50 text-red-700"
                            : product.stock <= 5
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-zinc-950">
                        {currency.format(product.price)}
                      </p>
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                        {product.subcategoryName}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-5 py-12 text-center text-sm text-zinc-500">
                {shopProducts.length > 0
                  ? "No products found for this category."
                  : "No products found for this shop."}
              </div>
            )}
          </div>

          <div className="scrollbar-hover hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Brand</th>
                  <th className="px-5 py-4">Selling Price</th>
                  <th className="px-5 py-4">Stock</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100 text-sm">
                {visibleProducts.length > 0 ? (
                  visibleProducts.map((product) => (
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
                            <p className="text-xs text-zinc-500">
                              {product.productCode}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                          {product.categoryName}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-zinc-700">
                        {product.subcategoryName}
                      </td>
                      <td className="px-5 py-4 font-medium text-zinc-950">
                        {currency.format(product.price)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            product.stock <= 0
                              ? "bg-red-50 text-red-700"
                              : product.stock <= 5
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
                          aria-disabled={product.stock <= 0}
                          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${
                            product.stock <= 0
                              ? "cursor-not-allowed border-zinc-200 text-zinc-400"
                              : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                          }`}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenProductQr(product);
                          }}
                        >
                          <QrCode className="h-4 w-4" />
                          QR
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm text-zinc-500"
                    >
                      {shopProducts.length > 0
                        ? "No products found for this category."
                        : "No products found for this shop."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {qrProduct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-[10px] backdrop-blur-sm sm:p-4">
          <div className="scrollbar-hidden max-h-[calc(100dvh-20px)] w-full max-w-md overflow-y-auto rounded-[28px] bg-white p-5 shadow-2xl sm:max-h-[calc(100vh-2rem)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Product QR
                </p>
                <h3 className="mt-1 text-2xl font-semibold">
                  {qrProduct.productName}
                </h3>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 hover:bg-zinc-50"
                onClick={() => {
                  setQrProduct(null);
                }}
                aria-label="Close QR"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex flex-col items-center rounded-[24px] bg-zinc-50 p-6">
              {qrProduct.mainImageUrl ? (
                <Image
                  src={qrProduct.mainImageUrl}
                  alt={qrProduct.productName}
                  width={180}
                  height={180}
                  unoptimized
                  className="mb-5 aspect-square w-full max-w-[180px] rounded-3xl object-cover"
                />
              ) : null}
              <div className="rounded-2xl bg-white p-4">
                <QRPreview value={createQrValue(qrProduct)} />
              </div>
              <p className="mt-4 text-center text-sm font-medium">
                {qrProduct.productCode}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Scan from the header to sell this product.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {[
                ["Shop", qrProduct.shopName],
                ["Category", qrProduct.categoryName],
                ["Brand", qrProduct.subcategoryName],
                ["Selling Price", currency.format(qrProduct.price)],
                ["Stock", `${qrProduct.stock} units`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-zinc-50 px-4 py-3 text-sm"
                >
                  <span className="text-zinc-500">{label}</span>
                  <span className="text-right font-semibold text-zinc-950">
                    {value}
                  </span>
                </div>
              ))}

              {qrProduct.description ? (
                <div className="rounded-2xl bg-zinc-50 px-4 py-3 text-sm">
                  <p className="text-zinc-500">Description</p>
                  <p className="mt-1 font-medium leading-6 text-zinc-950">
                    {qrProduct.description}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {saleProduct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-[28px] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Process sale
                </p>
                <h3 className="mt-1 text-2xl font-semibold">
                  {saleProduct.productName}
                </h3>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 hover:bg-zinc-50"
                onClick={() => {
                  setSaleProduct(null);
                }}
                aria-label="Cancel sale"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={confirmSale} className="mt-5 space-y-4">
              {saleProduct.mainImageUrl ? (
                <Image
                  src={saleProduct.mainImageUrl}
                  alt={saleProduct.productName}
                  width={160}
                  height={160}
                  unoptimized
                  className="mx-auto aspect-square w-full max-w-[160px] rounded-3xl object-cover"
                />
              ) : null}
              {[
                  ["Code", saleProduct.productCode],
                  ["Shop", saleProduct.shopName],
                  ["Price", currency.format(saleProduct.price)],
                  ["Available Stock", `${saleProduct.stock} units`],
                  [
                    "Payable",
                    currency.format(
                      Math.max(saleProduct.price * quantity - discount, 0)
                    ),
                  ],
                ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3 text-sm"
                >
                  <span className="text-zinc-500">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}

              <div>
                <label
                  htmlFor="quantity"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Quantity
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  max={saleProduct.stock}
                  value={quantity}
                  onChange={(event) => {
                    setQuantity(Math.trunc(Number(event.target.value) || 0));
                  }}
                  className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
                />
              </div>

              <div>
                <label
                  htmlFor="discount"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Discount optional
                </label>
                <input
                  id="discount"
                  name="discount"
                  type="number"
                  min={0}
                  max={saleProduct.price * quantity}
                  step="0.01"
                  value={discount}
                  onChange={(event) => {
                    setDiscount(Math.max(0, Number(event.target.value) || 0));
                  }}
                  placeholder="0"
                  className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
                />
              </div>

              <div>
                <label
                  htmlFor="proofNumber"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Proof number optional
                </label>
                <input
                  id="proofNumber"
                  name="proofNumber"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="Enter proof number"
                  className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
                />
              </div>

              <input type="hidden" name="productId" value={saleProduct.id} />

              <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
                onClick={() => {
                  setSaleProduct(null);
                }}
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSelling ||
                  quantity < 1 ||
                  quantity > saleProduct.stock ||
                  discount > saleProduct.price * quantity
                }
                aria-busy={isSelling}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              >
                {isSelling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Process
                  </>
                )}
              </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {latestBill ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-500">
                  Product sold
                </p>
                <h3 className="mt-1 text-xl font-semibold">
                  Do you want to download the bill?
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Invoice {latestBill.invoiceNo} for {latestBill.productName}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-zinc-50 px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-500">Quantity</span>
                <span className="font-semibold">{latestBill.quantity}</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-zinc-500">Net Amount</span>
                <span className="font-semibold">
                  {currency.format(latestBill.totalAmount)}
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
                onClick={() => {
                  setLatestBill(null);
                }}
              >
                <X className="h-4 w-4" />
                No
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                onClick={() => {
                  downloadBill(latestBill);
                  setLatestBill(null);
                }}
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-5 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-zinc-950 px-5 py-4 text-sm font-semibold text-white shadow-2xl">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500">
              <Check className="h-4 w-4" />
            </span>
            <span>{toast}</span>
          </div>
        </div>
      ) : null}
    </>
  );
}
