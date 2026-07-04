"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
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

interface ProductCreateFormProps {
  shops: ShopOption[];
  categories: CategoryOption[];
  subcategories: SubcategoryOption[];
  action: (
    state: ProductCreateState,
    formData: FormData
  ) => Promise<ProductCreateState>;
}

const ALL_SHOPS_VALUE = "all";
const ALL_BRANDS_VALUE = "all";
const initialCreateState: ProductCreateState = {
  ok: false,
  message: "",
};

export interface ProductCreateState {
  ok: boolean;
  message: string;
}

export function ProductCreateForm({
  shops,
  categories,
  subcategories,
  action,
}: ProductCreateFormProps) {
  const [state, formAction] = useActionState(action, initialCreateState);
  const formRef = useRef<HTMLFormElement>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [shopId, setShopId] = useState(ALL_SHOPS_VALUE);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [galleryCount, setGalleryCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [mainImagePreviewUrl, setMainImagePreviewUrl] = useState<string | null>(
    null
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
      setToast(state.message);

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2500);

      if (!state.ok) {
        return;
      }

      formRef.current?.reset();
      setShopId(ALL_SHOPS_VALUE);
      setCategoryId("");
      setSubcategoryId("");
      setGalleryCount(0);
      setMainImagePreviewUrl(null);
      setGalleryPreviewUrls([]);

      const productDirectory = document.getElementById("product-directory");

      productDirectory?.focus({
        preventScroll: true,
      });
      productDirectory?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });

      document.getElementById("product-directory-scroll")?.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }, 0);

    return () => {
      window.clearTimeout(effectTimer);
    };
  }, [state]);

  const availableCategories = useMemo(
    () =>
      shopId === ALL_SHOPS_VALUE
        ? categories
        : categories.filter(
            (category) => !category.shopId || category.shopId === shopId
          ),
    [categories, shopId]
  );

  const selectedCategoryId =
    categoryId && availableCategories.some((category) => category.id === categoryId)
      ? categoryId
      : availableCategories[0]?.id ?? "";
  const selectedCategory = availableCategories.find(
    (category) => category.id === selectedCategoryId
  );
  const isMobileCategory =
    selectedCategory?.name.trim().toLowerCase() === "mobile";

  const availableSubcategories = useMemo(
    () =>
      subcategories.filter(
        (subcategory) => subcategory.categoryId === selectedCategoryId
      ),
    [subcategories, selectedCategoryId]
  );
  const selectedSubcategoryId =
    subcategoryId === ALL_BRANDS_VALUE
      ? ALL_BRANDS_VALUE
      : subcategoryId &&
          availableSubcategories.some(
            (subcategory) => subcategory.id === subcategoryId
          )
        ? subcategoryId
        : availableSubcategories[0]?.id ?? "";

  return (
    <>
    <form
      ref={formRef}
      action={formAction}
      className="mt-6 space-y-4"
    >
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
              window.alert("You can upload a maximum of 3 optional images.");
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
        <label
          htmlFor="shopId"
          className="mb-2 block text-sm font-medium text-zinc-700"
        >
          Shop
        </label>
        <select
          id="shopId"
          name="shopId"
          required
          value={shopId}
          onChange={(event) => {
            setShopId(event.target.value);
            setCategoryId("");
            setSubcategoryId("");
          }}
          className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
        >
          <option value={ALL_SHOPS_VALUE}>
            All shops
          </option>
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
          className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
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
          disabled={availableSubcategories.length === 0}
          className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-100"
        >
          <option value={ALL_BRANDS_VALUE}>
            All brands
          </option>
          {availableSubcategories.map((subcategory) => (
            <option
              key={subcategory.id}
              value={subcategory.id}
            >
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
          availableCategories.length === 0 ||
          availableSubcategories.length === 0
        }
        pendingLabel="Creating product..."
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        Create Product
      </PendingSubmitButton>

      {shops.length === 0 ? (
        <p className="text-sm text-red-600">Create a shop before adding products.</p>
      ) : null}
      {shops.length > 0 && availableCategories.length === 0 ? (
        <p className="text-sm text-red-600">
          Create a category for this shop or choose All shops.
        </p>
      ) : null}
      {availableCategories.length > 0 && availableSubcategories.length === 0 ? (
        <p className="text-sm text-red-600">
          Create a brand under the selected category.
        </p>
      ) : null}
    </form>

    {toast ? (
      <div className="fixed right-5 top-5 z-[60] rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white shadow-xl">
        {toast}
      </div>
    ) : null}
    </>
  );
}
