"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, QrCode, X } from "lucide-react";
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
  saleAction: (productId: string, quantity: number) => Promise<void>;
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

export function EmployeeBillingClient({
  shops,
  products,
  saleAction,
}: EmployeeBillingClientProps) {
  const [selectedShopId, setSelectedShopId] = useState(shops[0]?.id ?? "");
  const [qrProduct, setQrProduct] = useState<BillingProduct | null>(null);
  const [saleProduct, setSaleProduct] = useState<BillingProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isSelling, setIsSelling] = useState(false);

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
        window.alert("Product not found for the selected shop.");
        return;
      }

      if (product.stock <= 0) {
        window.alert("This product is out of stock.");
        return;
      }

      setSaleProduct(product);
      setQuantity(1);
    }

    window.addEventListener("employee-product-scan", handleScan);

    return () => {
      window.removeEventListener("employee-product-scan", handleScan);
    };
  }, [products, selectedShopId]);

  async function confirmSale() {
    if (!saleProduct || quantity < 1 || quantity > saleProduct.stock) {
      return;
    }

    setIsSelling(true);

    try {
      await saleAction(saleProduct.id, quantity);
      setSaleProduct(null);
      setQuantity(1);
    } finally {
      setIsSelling(false);
    }
  }

  return (
    <>
      <div className="space-y-5">
        <section className="rounded-[24px] border border-zinc-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-500">
                Billing workflow
              </p>
              <h1 className="mt-1 text-3xl font-semibold">
                Choose shop and sell products
              </h1>
            </div>

            <div className="w-full max-w-sm">
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

          <div className="scrollbar-hover overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Subcategory</th>
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
                      className="cursor-pointer transition hover:bg-zinc-50"
                      onClick={() => {
                        setQrProduct(product);
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
                          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                          onClick={(event) => {
                            event.stopPropagation();
                            setQrProduct(product);
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
          <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl">
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
          </div>
        </div>
      ) : null}

      {saleProduct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-5 shadow-2xl">
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

            <div className="mt-5 space-y-3">
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
                  type="number"
                  min={1}
                  max={saleProduct.stock}
                  value={quantity}
                  onChange={(event) => {
                    setQuantity(Number(event.target.value));
                  }}
                  className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
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
                type="button"
                disabled={isSelling || quantity < 1 || quantity > saleProduct.stock}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                onClick={confirmSale}
              >
                <Check className="h-4 w-4" />
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
