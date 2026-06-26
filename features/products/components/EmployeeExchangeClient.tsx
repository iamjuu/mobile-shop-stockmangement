"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, RefreshCcw } from "lucide-react";
import Image from "next/image";

interface ShopOption {
  id: string;
  shopName: string;
}

interface CategoryOption {
  id: string;
  name: string;
  shopId?: string | null;
}

interface SubcategoryOption {
  id: string;
  name: string;
  categoryId: string;
}

interface ExchangeProduct {
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
}

interface EmployeeExchangeClientProps {
  shops: ShopOption[];
  categories: CategoryOption[];
  subcategories: SubcategoryOption[];
  products: ExchangeProduct[];
  action: (formData: FormData) => Promise<{
    success: boolean;
    message: string;
  }>;
}

const currency = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  style: "currency",
});

export function EmployeeExchangeClient({
  shops,
  categories,
  subcategories,
  products,
  action,
}: EmployeeExchangeClientProps) {
  const [shopId, setShopId] = useState(shops[0]?.id ?? "");
  const [soldProductId, setSoldProductId] = useState("");
  const [categoryMode, setCategoryMode] = useState<"existing" | "new">("existing");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryMode, setSubcategoryMode] =
    useState<"existing" | "new">("existing");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [exchangeValue, setExchangeValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const shopProducts = useMemo(
    () => products.filter((product) => product.shopId === shopId),
    [products, shopId]
  );
  const selectedSoldProduct =
    shopProducts.find((product) => product.id === soldProductId) ??
    shopProducts.find((product) => product.stock > 0) ??
    shopProducts[0] ??
    null;
  const activeSoldProductId = selectedSoldProduct?.id ?? "";
  const availableCategories = useMemo(
    () =>
      categories.filter(
        (category) => !category.shopId || category.shopId === shopId
      ),
    [categories, shopId]
  );
  const activeCategoryId =
    categoryMode === "existing"
      ? categoryId &&
        availableCategories.some((category) => category.id === categoryId)
        ? categoryId
        : availableCategories[0]?.id ?? ""
      : "";
  const availableSubcategories = useMemo(
    () =>
      subcategories.filter(
        (subcategory) => subcategory.categoryId === activeCategoryId
      ),
    [activeCategoryId, subcategories]
  );
  const activeSubcategoryId =
    subcategoryMode === "existing"
      ? subcategoryId &&
        availableSubcategories.some(
          (subcategory) => subcategory.id === subcategoryId
        )
        ? subcategoryId
        : availableSubcategories[0]?.id ?? ""
      : "";
  const cashBalance = Math.max(
    0,
    (selectedSoldProduct?.price ?? 0) - exchangeValue
  );
  const isInvalidExchange =
    !selectedSoldProduct ||
    selectedSoldProduct.stock <= 0 ||
    exchangeValue < 0 ||
    exchangeValue > selectedSoldProduct.price ||
    (categoryMode === "existing" && !activeCategoryId) ||
    (subcategoryMode === "existing" && !activeSubcategoryId);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setMessage(null);

    try {
      formData.set("shopId", shopId);
      formData.set("soldProductId", activeSoldProductId);
      formData.set("categoryMode", categoryMode);
      formData.set("subcategoryMode", subcategoryMode);

      if (categoryMode === "existing") {
        formData.set("categoryId", activeCategoryId);
      }

      if (subcategoryMode === "existing") {
        formData.set("subcategoryId", activeSubcategoryId);
      }

      const result = await action(formData);
      setMessage(result.message);

      if (result.success) {
        setExchangeValue(0);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-zinc-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-950 text-white">
            <RefreshCcw className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Employee exchange
            </p>
            <h1 className="text-3xl font-semibold">Exchange</h1>
          </div>
        </div>
      </section>

      <form
        action={handleSubmit}
        className="grid gap-5 xl:grid-cols-[1fr_420px]"
      >
        <section className="space-y-5 rounded-[24px] border border-zinc-200 bg-white p-5">
          <div>
            <h2 className="text-xl font-semibold">Product customer buys</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Choose the product sold in exchange.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="shopId"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Shop
              </label>
              <select
                id="shopId"
                value={shopId}
                onChange={(event) => {
                  setShopId(event.target.value);
                  setSoldProductId("");
                  setCategoryId("");
                  setSubcategoryId("");
                }}
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-950"
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

            <div>
              <label
                htmlFor="soldProductId"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Sold product
              </label>
              <select
                id="soldProductId"
                value={activeSoldProductId}
                onChange={(event) => {
                  setSoldProductId(event.target.value);
                }}
                required
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-950"
              >
                {shopProducts.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                    disabled={product.stock <= 0}
                  >
                    {product.productName} - {currency.format(product.price)}
                    {product.stock <= 0 ? " - Out of stock" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedSoldProduct ? (
            <div className="rounded-[24px] bg-zinc-50 p-4">
              <div className="flex items-center gap-4">
                {selectedSoldProduct.mainImageUrl ? (
                  <Image
                    src={selectedSoldProduct.mainImageUrl}
                    alt={selectedSoldProduct.productName}
                    width={72}
                    height={72}
                    unoptimized
                    className="size-18 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex size-18 items-center justify-center rounded-2xl bg-zinc-950 text-xl font-semibold text-white">
                    {selectedSoldProduct.productName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold">{selectedSoldProduct.productName}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {selectedSoldProduct.productCode} -{" "}
                    {selectedSoldProduct.stock} in stock
                  </p>
                </div>
              </div>
              {selectedSoldProduct.stock <= 0 ? (
                <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  Out of stock.
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
              No products found for this shop.
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold">Received phone</h2>
            <p className="mt-1 text-sm text-zinc-500">
              This will be created as an Exchange Third Party product.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="receivedProductName"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Phone name/model
              </label>
              <input
                id="receivedProductName"
                name="receivedProductName"
                required
                placeholder="Example: iPhone 12 128GB"
                className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
              />
            </div>

            <div>
              <label
                htmlFor="receivedImage"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Phone image
              </label>
              <input
                id="receivedImage"
                name="receivedImage"
                type="file"
                accept="image/*"
                required
                className="w-full rounded-3xl border border-dashed border-zinc-300 bg-white px-4 py-4 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-zinc-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="categoryId"
                  className="text-sm font-medium text-zinc-700"
                >
                  Category
                </label>
                <button
                  type="button"
                  className="rounded-full border border-zinc-300 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
                  onClick={() => {
                    setCategoryMode(
                      categoryMode === "existing" ? "new" : "existing"
                    );
                  }}
                >
                  {categoryMode === "existing" ? "Create new" : "Use existing"}
                </button>
              </div>
              {categoryMode === "existing" ? (
                <select
                  id="categoryId"
                  value={activeCategoryId}
                  onChange={(event) => {
                    setCategoryId(event.target.value);
                    setSubcategoryId("");
                  }}
                  required
                  className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-950"
                >
                  {availableCategories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name="newCategoryName"
                  required
                  placeholder="New category name"
                  className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
                />
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="subcategoryId"
                  className="text-sm font-medium text-zinc-700"
                >
                  Brand
                </label>
                <button
                  type="button"
                  className="rounded-full border border-zinc-300 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
                  onClick={() => {
                    setSubcategoryMode(
                      subcategoryMode === "existing" ? "new" : "existing"
                    );
                  }}
                >
                  {subcategoryMode === "existing"
                    ? "Create new"
                    : "Use existing"}
                </button>
              </div>
              {subcategoryMode === "existing" ? (
                <select
                  id="subcategoryId"
                  value={activeSubcategoryId}
                  onChange={(event) => {
                    setSubcategoryId(event.target.value);
                  }}
                  required
                  className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-950"
                >
                  {availableSubcategories.map((subcategory) => (
                    <option
                      key={subcategory.id}
                      value={subcategory.id}
                    >
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name="newSubcategoryName"
                  required
                  placeholder="New brand name"
                  className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
                />
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="exchangeValue"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Exchange value
              </label>
              <input
                id="exchangeValue"
                name="exchangeValue"
                type="number"
                min="0"
                step="0.01"
                value={exchangeValue}
                onChange={(event) => {
                  setExchangeValue(Number(event.target.value));
                }}
                required
                className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
              />
            </div>

            <div>
              <label
                htmlFor="receivedPrice"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Resale price
              </label>
              <input
                id="receivedPrice"
                name="receivedPrice"
                type="number"
                min="0"
                step="0.01"
                required
                className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
              />
            </div>

            <div>
              <label
                htmlFor="condition"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Condition
              </label>
              <input
                id="condition"
                name="condition"
                placeholder="Good, display issue..."
                className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="paymentMethod"
              className="mb-2 block text-sm font-medium text-zinc-700"
            >
              Payment method
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              defaultValue="CASH"
              className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-950"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="notes"
              className="mb-2 block text-sm font-medium text-zinc-700"
            >
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full resize-none rounded-3xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
            />
          </div>
        </section>

        <aside className="h-fit rounded-[24px] border border-zinc-200 bg-white p-5">
          <h2 className="text-xl font-semibold">Exchange summary</h2>
          <div className="mt-5 space-y-3">
            {[
              ["Product price", currency.format(selectedSoldProduct?.price ?? 0)],
              ["Exchange value", currency.format(exchangeValue || 0)],
              ["Cash balance", currency.format(cashBalance)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3 text-sm"
              >
                <span className="text-zinc-500">{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || isInvalidExchange}
            aria-busy={isSubmitting}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving exchange...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Complete Exchange
              </>
            )}
          </button>
        </aside>
      </form>
    </div>
  );
}
