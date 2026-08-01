"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ImageIcon, Loader2, Package, Pencil, X } from "lucide-react";
import Image from "next/image";

import { PendingSubmitButton } from "@/components/pending-submit-button";

interface ShopOption {
  id: string;
  shopName: string;
}

interface CategoryOption {
  id: string;
  name: string;
  shopId?: string | null;
  shop?: {
    shopName: string;
  } | null;
}

interface SubcategoryOption {
  id: string;
  name: string;
  categoryId: string;
}

export interface SavedProduct {
  id: string;
  productCode: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  shopName: string;
  subcategoryName: string;
  purchasePrice?: number | null;
  price: number;
  stock: number;
  mainImageUrl?: string | null;
  galleryImageUrls?: string[];
  description?: string | null;
  createdAt: string;
}

interface ProductCreateFormProps {
  shops: ShopOption[];
  categories: CategoryOption[];
  subcategories: SubcategoryOption[];
  action: (
    state: ProductCreateState,
    formData: FormData,
  ) => Promise<ProductCreateState>;
  updateAction: (
    productId: string,
    data: {
      productName: string;
      subcategoryId: string;
      purchasePrice: number;
      price: number;
      stock: number;
      description?: string;
    },
  ) => Promise<{
    ok: boolean;
    message: string;
  }>;
}

const initialCreateState: ProductCreateState = {
  ok: false,
  message: "",
};
const currency = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  style: "currency",
});

export interface ProductCreateState {
  ok: boolean;
  message: string;
  product?: SavedProduct;
}

export function ProductCreateForm({
  shops,
  categories,
  subcategories,
  action,
  updateAction,
}: ProductCreateFormProps) {
  const [state, formAction] = useActionState(action, initialCreateState);
  const formRef = useRef<HTMLFormElement>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [allShopsSelected, setAllShopsSelected] = useState(false);
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [galleryCount, setGalleryCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [savedProduct, setSavedProduct] = useState<SavedProduct | null>(null);
  const [editProduct, setEditProduct] = useState<SavedProduct | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mainImagePreviewUrl, setMainImagePreviewUrl] = useState<string | null>(
    null,
  );
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (mainImagePreviewUrl) {
        URL.revokeObjectURL(mainImagePreviewUrl);
      }
    };
  }, [mainImagePreviewUrl]);

  useEffect(() => {
    return () => {
      galleryPreviewUrls.forEach((previewUrl) => {
        URL.revokeObjectURL(previewUrl);
      });
    };
  }, [galleryPreviewUrls]);

  useEffect(() => {
    if (!state.message) {
      return;
    }

    const effectTimer = window.setTimeout(() => {
      if (!state.ok || !state.product) {
        return;
      }

      setToast(state.message);
      setSavedProduct(state.product);

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2500);

      formRef.current?.reset();
      setAllShopsSelected(false);
      setSelectedShopIds([]);
      setCategoryId("");
      setSubcategoryId("");
      setGalleryCount(0);
      setMainImagePreviewUrl(null);
      setGalleryPreviewUrls([]);
    }, 0);

    return () => {
      window.clearTimeout(effectTimer);
    };
  }, [state]);

  const availableCategories = useMemo(
    () => {
      if (selectedShopIds.length === 0) {
        return [];
      }

      if (selectedShopIds.length > 1) {
        return categories.filter((category) => !category.shopId);
      }

      const [selectedShopId] = selectedShopIds;

      return categories.filter(
        (category) => !category.shopId || category.shopId === selectedShopId,
      );
    },
    [categories, selectedShopIds],
  );

  const selectedCategoryId =
    categoryId &&
    availableCategories.some((category) => category.id === categoryId)
      ? categoryId
      : "";
  const selectedCategory = availableCategories.find(
    (category) => category.id === selectedCategoryId,
  );
  const isMobileCategory =
    selectedCategory?.name.trim().toLowerCase() === "mobile";

  const availableSubcategories = useMemo(
    () =>
      subcategories.filter(
        (subcategory) => subcategory.categoryId === selectedCategoryId,
      ),
    [subcategories, selectedCategoryId],
  );
  const selectedSubcategoryId =
    subcategoryId &&
    availableSubcategories.some(
      (subcategory) => subcategory.id === subcategoryId,
    )
      ? subcategoryId
      : "";
  const editBrandOptions = useMemo(
    () =>
      editProduct
        ? subcategories.filter(
            (subcategory) => subcategory.categoryId === editProduct.categoryId,
          )
        : [],
    [editProduct, subcategories],
  );

  function toggleShop(shopId: string) {
    setAllShopsSelected(false);
    setSelectedShopIds((currentShopIds) => {
      const nextShopIds = currentShopIds.includes(shopId)
        ? currentShopIds.filter((currentShopId) => currentShopId !== shopId)
        : [...currentShopIds, shopId];

      setCategoryId("");
      setSubcategoryId("");

      return nextShopIds;
    });
  }

  function toggleAllShops() {
    setAllShopsSelected((currentValue) => {
      const nextValue = !currentValue;

      setSelectedShopIds(nextValue ? shops.map((shop) => shop.id) : []);
      setCategoryId("");
      setSubcategoryId("");

      return nextValue;
    });
  }

  async function handleUpdate(formData: FormData) {
    if (!editProduct) {
      return;
    }

    setIsSaving(true);

    try {
      const subcategoryId = String(formData.get("subcategoryId") ?? "");
      const selectedBrand = subcategories.find(
        (subcategory) => subcategory.id === subcategoryId,
      );
      const updatedProduct = {
        productName: String(formData.get("productName") ?? ""),
        subcategoryId,
        purchasePrice: Number(formData.get("purchasePrice") ?? 0),
        price: Number(formData.get("price") ?? 0),
        stock: Number(formData.get("stock") ?? 0),
        description: String(formData.get("description") ?? ""),
      };
      const result = await updateAction(editProduct.id, updatedProduct);

      setToast(result.message);
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2500);

      if (result.ok) {
        const nextProduct = {
          ...editProduct,
          ...updatedProduct,
          productName: updatedProduct.productName.trim(),
          subcategoryName: selectedBrand?.name ?? editProduct.subcategoryName,
          stock: Math.trunc(updatedProduct.stock),
          description: updatedProduct.description.trim() || null,
        };

        setSavedProduct(nextProduct);
        setEditProduct(null);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[430px_1fr]">
        <section className="rounded-[24px] border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-950 text-white">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">
                Inventory setup
              </p>
              <h1 className="text-3xl font-semibold">Add Product</h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-zinc-500">
            Add products by selecting the shop first. Categories are filtered
            by the shop, and brands are filtered by the selected category.
          </p>

          <form ref={formRef} action={formAction} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="productName"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Product name
              </label>
              <input
                id="productName"
                name="productName"
                type="text"
                required
                placeholder="Example: iPhone charger"
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
              />
            </div>

            <div>
              <label
                htmlFor="mainImage"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Main image
              </label>
              <input
                id="mainImage"
                name="mainImage"
                type="file"
                accept="image/*"
                required
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  setMainImagePreviewUrl((currentPreviewUrl) => {
                    if (currentPreviewUrl) {
                      URL.revokeObjectURL(currentPreviewUrl);
                    }

                    return file ? URL.createObjectURL(file) : null;
                  });
                }}
                className="w-full rounded-3xl border border-dashed border-zinc-300 bg-white px-4 py-4 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-zinc-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              {mainImagePreviewUrl ? (
                <div className="mt-3 flex items-center gap-3 rounded-2xl bg-zinc-50 p-2">
                  <Image
                    src={mainImagePreviewUrl}
                    alt="Main image preview"
                    width={64}
                    height={64}
                    unoptimized
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                  <span className="text-xs font-medium text-zinc-600">
                    Main image preview
                  </span>
                </div>
              ) : null}
              <p className="mt-2 text-xs text-zinc-500">
                Required. This image appears in product lists and sale screens.
              </p>
            </div>

            <div>
              <label
                htmlFor="galleryImages"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Other images
              </label>
              <input
                id="galleryImages"
                name="galleryImages"
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);

                  if (files.length > 3) {
                    window.alert(
                      "You can upload a maximum of 3 optional images.",
                    );
                    event.target.value = "";
                    setGalleryCount(0);
                    setGalleryPreviewUrls((currentPreviewUrls) => {
                      currentPreviewUrls.forEach((previewUrl) => {
                        URL.revokeObjectURL(previewUrl);
                      });

                      return [];
                    });
                    return;
                  }

                  setGalleryCount(files.length);
                  setGalleryPreviewUrls((currentPreviewUrls) => {
                    currentPreviewUrls.forEach((previewUrl) => {
                      URL.revokeObjectURL(previewUrl);
                    });

                    return files.map((file) => URL.createObjectURL(file));
                  });
                }}
                className="w-full rounded-3xl border border-dashed border-zinc-300 bg-white px-4 py-4 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-700"
              />
              {galleryPreviewUrls.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2 rounded-2xl bg-zinc-50 p-2">
                  {galleryPreviewUrls.map((previewUrl, index) => (
                    <Image
                      key={previewUrl}
                      src={previewUrl}
                      alt={`Other image preview ${index + 1}`}
                      width={56}
                      height={56}
                      unoptimized
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                  ))}
                </div>
              ) : null}
              <p className="mt-2 text-xs text-zinc-500">
                Optional. Maximum 3 images selected: {galleryCount}
              </p>
            </div>

            <div>
              <p className="mb-2 block text-sm font-medium text-zinc-700">
                Shop
              </p>

              {selectedShopIds.map((selectedShopId) => (
                <input
                  key={selectedShopId}
                  type="hidden"
                  name="shopIds"
                  value={selectedShopId}
                />
              ))}

              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 transition hover:bg-zinc-50">
                  <input
                    type="checkbox"
                    checked={allShopsSelected}
                    disabled={shops.length === 0}
                    onChange={toggleAllShops}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-medium text-zinc-900">
                    All shops
                  </span>
                </label>

              <div className="max-h-56 space-y-2 overflow-y-auto rounded-[20px] border border-zinc-200 p-3">
                {shops.length > 0 ? (
                  shops.map((shop) => {
                    const isChecked = selectedShopIds.includes(shop.id);

                    return (
                      <label
                        key={shop.id}
                        className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-zinc-50"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={allShopsSelected}
                          onChange={() => {
                            toggleShop(shop.id);
                          }}
                          className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 disabled:cursor-not-allowed"
                        />
                        <span className="text-sm text-zinc-700">
                          {shop.shopName}
                        </span>
                      </label>
                    );
                  })
                ) : (
                  <p className="px-3 py-2 text-sm text-zinc-500">
                    No shops created yet.
                  </p>
                )}
              </div>
              </div>

              {selectedShopIds.length > 1 ? (
                <p className="mt-2 text-xs text-zinc-500">
                  Multiple shops can use only All shops categories.
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="categoryId"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                required
                value={selectedCategoryId}
                onChange={(event) => {
                  setCategoryId(event.target.value);
                  setSubcategoryId("");
                }}
                disabled={
                  selectedShopIds.length === 0 ||
                  availableCategories.length === 0
                }
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
              >
                <option value="">Choose category</option>
                {availableCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="subcategoryId"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Brand
              </label>
              <select
                id="subcategoryId"
                name="subcategoryId"
                required
                value={selectedSubcategoryId}
                onChange={(event) => {
                  setSubcategoryId(event.target.value);
                }}
                disabled={
                  !selectedCategoryId || availableSubcategories.length === 0
                }
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-100"
              >
                <option value="">Choose brand</option>
                {availableSubcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
            </div>

            {isMobileCategory ? (
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
                  required
                  placeholder="Enter IMEI number"
                  className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                />
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="purchasePrice"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Purchase price
                </label>
                <input
                  id="purchasePrice"
                  name="purchasePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                />
              </div>

              <div>
                <label
                  htmlFor="price"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Selling price
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                />
              </div>

              <div>
                <label
                  htmlFor="stock"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Stock
                </label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  required
                  placeholder="0"
                  className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Optional product notes"
                className="w-full resize-none rounded-3xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
              />
            </div>

            <PendingSubmitButton
              disabled={
                shops.length === 0 ||
                selectedShopIds.length === 0 ||
                !selectedCategoryId ||
                !selectedSubcategoryId ||
                availableCategories.length === 0 ||
                availableSubcategories.length === 0
              }
              pendingLabel="Creating product..."
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              Create Product
            </PendingSubmitButton>

            {state.message && !state.ok ? (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {state.message}
              </p>
            ) : null}

            {shops.length === 0 ? (
              <p className="text-sm text-red-600">
                Create a shop before adding products.
              </p>
            ) : null}
            {shops.length > 0 && availableCategories.length === 0 ? (
              <p className="text-sm text-red-600">
                Choose shops with a shared category or create an All shops
                category for multi-shop products.
              </p>
            ) : null}
            {availableCategories.length > 0 &&
            availableSubcategories.length === 0 ? (
              <p className="text-sm text-red-600">
                Create a brand under the selected category.
              </p>
            ) : null}
          </form>
        </section>

        <section className="min-h-[520px] rounded-[24px] border border-zinc-200 bg-white p-5">
          {savedProduct ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Product saved
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-zinc-950">
                    {savedProduct.productName}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {savedProduct.productCode}
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
                  onClick={() => {
                    setEditProduct(savedProduct);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Change
                </button>
              </div>

              <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                <div className="rounded-[20px] bg-zinc-50 p-3">
                  {savedProduct.mainImageUrl ? (
                    <Image
                      src={savedProduct.mainImageUrl}
                      alt={savedProduct.productName}
                      width={220}
                      height={220}
                      unoptimized
                      className="aspect-square w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-white text-zinc-400">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {[
                    ["Shop", savedProduct.shopName],
                    ["Category", savedProduct.categoryName],
                    ["Brand", savedProduct.subcategoryName],
                    [
                      "Purchase Price",
                      currency.format(savedProduct.purchasePrice ?? 0),
                    ],
                    ["Selling Price", currency.format(savedProduct.price)],
                    [
                      "Profit Per Sale",
                      currency.format(
                        savedProduct.price - (savedProduct.purchasePrice ?? 0),
                      ),
                    ],
                    ["Stock", `${savedProduct.stock} units`],
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
                </div>
              </div>

              {savedProduct.galleryImageUrls?.length ? (
                <div className="grid grid-cols-3 gap-3">
                  {savedProduct.galleryImageUrls.map((imageUrl, index) => (
                    <Image
                      key={imageUrl}
                      src={imageUrl}
                      alt={`${savedProduct.productName} ${index + 1}`}
                      width={120}
                      height={120}
                      unoptimized
                      className="aspect-square rounded-2xl object-cover"
                    />
                  ))}
                </div>
              ) : null}

              {savedProduct.description ? (
                <div className="rounded-2xl bg-zinc-50 px-4 py-3">
                  <p className="text-sm text-zinc-500">Description</p>
                  <p className="mt-1 text-sm font-medium text-zinc-950">
                    {savedProduct.description}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-[470px] flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                <Package className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-zinc-950">
                Saved product details
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                Create a product to see the saved details here for confirmation
                and quick changes.
              </p>
            </div>
          )}
        </section>
      </div>

      {editProduct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-5">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Change saved product
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
                aria-label="Close change product"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={handleUpdate} className="space-y-4 p-5">
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

              {editBrandOptions.length > 0 ? (
                <div>
                  <label
                    htmlFor="editSubcategoryId"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Brand
                  </label>
                  <select
                    id="editSubcategoryId"
                    name="subcategoryId"
                    required
                    defaultValue={editProduct.subcategoryId}
                    className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-950"
                  >
                    {editBrandOptions.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

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
        <div className="fixed right-5 top-5 z-[60] rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      ) : null}
    </>
  );
}
