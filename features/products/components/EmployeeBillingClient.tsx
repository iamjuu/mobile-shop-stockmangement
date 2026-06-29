"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, IdCard, Loader2, QrCode, X } from "lucide-react";
import Image from "next/image";

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
  categoryName: string;
  subcategoryName: string;
  price: number;
  stock: number;
  mainImageUrl?: string | null;
  description?: string | null;
}

interface EmployeeBillingClientProps {
  shops: ShopOption[];
  products: BillingProduct[];
  saleAction: (formData: FormData) => Promise<{ success: boolean }>;
}

const currency = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  style: "currency",
});
const proofTypes = [
  ["AADHAAR", "Aadhaar"],
  ["DRIVING_LICENCE", "Driving Licence"],
  ["VOTER_ID", "Voter ID"],
] as const;

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

export function EmployeeBillingClient({
  shops,
  products,
  saleAction,
}: EmployeeBillingClientProps) {
  const [selectedShopId, setSelectedShopId] = useState(shops[0]?.id ?? "");
  const [qrProduct, setQrProduct] = useState<BillingProduct | null>(null);
  const [saleProduct, setSaleProduct] = useState<BillingProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [proofType, setProofType] = useState<(typeof proofTypes)[number][0]>(
    "AADHAAR"
  );
  const [isSelling, setIsSelling] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const saleLockedRef = useRef(false);

  const visibleProducts = useMemo(
    () => products.filter((product) => product.shopId === selectedShopId),
    [products, selectedShopId]
  );

  useEffect(() => {
    function handleScan(event: Event) {
      const scannedValue = (event as CustomEvent<string>).detail;
      const productCode = getProductCodeFromScan(scannedValue);
      const product = products.find(
        (item) =>
          item.productCode === productCode &&
          (!selectedShopId || item.shopId === selectedShopId)
      );

      if (!product) {
        setToast("Product not found for the selected shop.");
        return;
      }

      if (product.stock <= 0) {
        setToast("Out of stock.");
        return;
      }

      setQrProduct(null);
      setSaleProduct(product);
      setQuantity(1);
      setDiscount(0);
      setProofType("AADHAAR");
    }

    window.addEventListener("employee-product-scan", handleScan);

    return () => {
      window.removeEventListener("employee-product-scan", handleScan);
    };
  }, [products, selectedShopId]);

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
        setToast("Sale could not be completed. Check stock, proof images, and discount.");
        return;
      }

      setSaleProduct(null);
      setQuantity(1);
      setDiscount(0);
      setProofType("AADHAAR");
      setToast(
        `Sold ${soldProduct.productName} - ${currency.format(
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
          <div className="grid gap-4 md:grid-cols-[1fr_360px] md:items-end">
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
          </div>
        </section>

        <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold">
                Products for sale
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {visibleProducts.length} products in selected shop
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
                No products found for this shop.
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
                      No products found for this shop.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {qrProduct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-[28px] bg-white p-5 shadow-2xl">
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
                  Confirm sale
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
                <p className="mb-2 text-sm font-medium text-zinc-700">
                  Proof type
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {proofTypes.map(([value, label]) => (
                    <label
                      key={value}
                      className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-center text-xs font-semibold ${
                        proofType === value
                          ? "border-zinc-950 bg-zinc-950 text-white"
                          : "border-zinc-300 text-zinc-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="proofType"
                        value={value}
                        checked={proofType === value}
                        onChange={() => {
                          setProofType(value);
                        }}
                        className="sr-only"
                      />
                      <IdCard className="h-4 w-4" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="proofFront"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Proof front
                  </label>
                  <input
                    id="proofFront"
                    name="proofFront"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    required
                    className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-zinc-950 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="proofBack"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Proof back
                  </label>
                  <input
                    id="proofBack"
                    name="proofBack"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    required
                    className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-zinc-950 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                  />
                </div>
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
                    Confirming...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Confirm
                  </>
                )}
              </button>
              </div>
            </form>
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
