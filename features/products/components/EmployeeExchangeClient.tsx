"use client";

import { useMemo, useRef, useState } from "react";
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
  const [dealType, setDealType] = useState<"EXCHANGE" | "MONEY">("EXCHANGE");
  const [shopId, setShopId] = useState(shops[0]?.id ?? "");
  const [soldProductId, setSoldProductId] = useState("");
  const [categoryMode, setCategoryMode] = useState<"existing" | "new">("existing");
  const [categoryId, setCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [subcategoryMode, setSubcategoryMode] =
    useState<"existing" | "new">("existing");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [exchangeValue, setExchangeValue] = useState(0);
  const [imeiNumber, setImeiNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const submitLockedRef = useRef(false);

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
        : availableCategories.find(
            (category) => category.name.toLowerCase() === "mobile"
          )?.id ??
          availableCategories[0]?.id ??
          ""
      : "";
  const activeCategoryName =
    categoryMode === "existing"
      ? availableCategories.find((category) => category.id === activeCategoryId)
          ?.name ?? ""
      : newCategoryName;
  const isMobileCategory = activeCategoryName.trim().toLowerCase() === "mobile";
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
    (dealType === "EXCHANGE" &&
      (!selectedSoldProduct || selectedSoldProduct.stock <= 0)) ||
    exchangeValue < 0 ||
    (dealType === "EXCHANGE" &&
      !!selectedSoldProduct &&
      exchangeValue > selectedSoldProduct.price) ||
    (categoryMode === "existing" && !activeCategoryId) ||
    (subcategoryMode === "existing" && !activeSubcategoryId) ||
    (isMobileCategory && !imeiNumber.trim());

  async function handleSubmit(formData: FormData) {
    if (submitLockedRef.current) {
      return;
    }

    submitLockedRef.current = true;
    setIsSubmitting(true);
    setMessage("Saving exchange...");

    try {
      formData.set("shopId", shopId);
      formData.set("dealType", dealType);
      if (dealType === "EXCHANGE") {
        formData.set("soldProductId", activeSoldProductId);
      }
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
        setImeiNumber("");
      }
    } finally {
      submitLockedRef.current = false;
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
          <fieldset
            disabled={isSubmitting}
            className="space-y-5 disabled:pointer-events-none disabled:opacity-70"
          >
          <div className="grid gap-2 rounded-full bg-zinc-100 p-1 sm:grid-cols-2">
            {[
              ["EXCHANGE", "Exchange user"],
              ["MONEY", "Money user"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  dealType === value
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-600 hover:bg-white"
                }`}
                onClick={() => {
                  setDealType(value as "EXCHANGE" | "MONEY");
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {dealType === "EXCHANGE" ? (
            <>
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
                  setNewCategoryName("");
                  setSubcategoryId("");
                  setImeiNumber("");
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
            </>
          ) : null}

          <div>
            <h2 className="text-xl font-semibold">Customer</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="customerName"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Customer name
              </label>
              <input
                id="customerName"
                name="customerName"
                required
                placeholder="Customer name"
                className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
              />
            </div>

            <div>
              <label
                htmlFor="customerPhone"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Customer phone
              </label>
              <input
                id="customerPhone"
                name="customerPhone"
                type="tel"
                required
                placeholder="Customer phone"
                className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
              />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Received phone</h2>
            <p className="mt-1 text-sm text-zinc-500">
              This will be created as an Exchange Third Party product.
            </p>
          </div>

          <div>
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
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="receivedImage"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Device image 1
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

            <div>
              <label
                htmlFor="deviceImageOne"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Device image 2
              </label>
              <input
                id="deviceImageOne"
                name="deviceImageOne"
                type="file"
                accept="image/*"
                required
                className="w-full rounded-3xl border border-dashed border-zinc-300 bg-white px-4 py-4 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-zinc-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="deviceImageTwo"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Device image 3 optional
              </label>
              <input
                id="deviceImageTwo"
                name="deviceImageTwo"
                type="file"
                accept="image/*"
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
                    setNewCategoryName("");
                    setSubcategoryId("");
                    setImeiNumber("");
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
                  value={newCategoryName}
                  onChange={(event) => {
                    setNewCategoryName(event.target.value);
                  }}
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
                {dealType === "EXCHANGE" ? "Exchange value" : "Purchase amount"}
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

          {isMobileCategory ? (
            <div>
              <div>
                <label
                  htmlFor="imeiNumber"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  IMEI number
                </label>
                <input
                  id="imeiNumber"
                  name="imeiNumber"
                  value={imeiNumber}
                  onChange={(event) => {
                    setImeiNumber(event.target.value);
                  }}
                  required
                  placeholder="Enter IMEI number"
                  className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
                />
              </div>
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700">
              Proof type
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["AADHAAR", "Aadhaar"],
                ["LICENSE", "License"],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center justify-center rounded-2xl border border-zinc-300 px-3 py-3 text-center text-xs font-semibold text-zinc-700 has-[:checked]:border-zinc-950 has-[:checked]:bg-zinc-950 has-[:checked]:text-white"
                >
                  <input
                    type="radio"
                    name="proofType"
                    value={value}
                    defaultChecked={value === "AADHAAR"}
                    required
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
                required
                className="w-full rounded-3xl border border-dashed border-zinc-300 bg-white px-4 py-4 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-zinc-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
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
                required
                className="w-full rounded-3xl border border-dashed border-zinc-300 bg-white px-4 py-4 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-zinc-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
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
          </fieldset>
        </section>

        <aside className="h-fit rounded-[24px] border border-zinc-200 bg-white p-5">
          <h2 className="text-xl font-semibold">
            {dealType === "EXCHANGE" ? "Exchange summary" : "Money summary"}
          </h2>
          <div className="mt-5 space-y-3">
            {(dealType === "EXCHANGE"
              ? [
                  [
                    "Product price",
                    currency.format(selectedSoldProduct?.price ?? 0),
                  ],
                  ["Exchange value", currency.format(exchangeValue || 0)],
                  ["Cash balance", currency.format(cashBalance)],
                ]
              : [
                  ["Amount paid", currency.format(exchangeValue || 0)],
                  ["Resale price", "Enter in form"],
                ]
            ).map(([label, value]) => (
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
            <div
              className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-medium ${
                isSubmitting
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-zinc-200 bg-zinc-50"
              }`}
              aria-live="polite"
            >
              <div className="flex items-center gap-2">
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                <span>{message}</span>
              </div>
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
