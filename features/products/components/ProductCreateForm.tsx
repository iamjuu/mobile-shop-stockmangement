"use client";

import { useMemo, useState } from "react";

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
  action: (formData: FormData) => void;
}

export function ProductCreateForm({
  shops,
  categories,
  subcategories,
  action,
}: ProductCreateFormProps) {
  const [shopId, setShopId] = useState(shops[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");

  const availableCategories = useMemo(
    () =>
      categories.filter(
        (category) => !category.shopId || category.shopId === shopId
      ),
    [categories, shopId]
  );

  const selectedCategoryId =
    categoryId && availableCategories.some((category) => category.id === categoryId)
      ? categoryId
      : availableCategories[0]?.id ?? "";

  const availableSubcategories = useMemo(
    () =>
      subcategories.filter(
        (subcategory) => subcategory.categoryId === selectedCategoryId
      ),
    [subcategories, selectedCategoryId]
  );

  return (
    <form
      action={action}
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
          }}
          className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
        >
          {availableCategories.map((category) => (
            <option
              key={category.id}
              value={category.id}
            >
              {category.name} - {category.shop?.shopName ?? "All shops"}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="subcategoryId"
          className="mb-2 block text-sm font-medium text-zinc-700"
        >
          Subcategory
        </label>
        <select
          id="subcategoryId"
          name="subcategoryId"
          required
          disabled={availableSubcategories.length === 0}
          className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-100"
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
      </div>

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

      <button
        type="submit"
        disabled={
          shops.length === 0 ||
          availableCategories.length === 0 ||
          availableSubcategories.length === 0
        }
        className="w-full rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        Create Product
      </button>

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
          Create a subcategory under the selected category.
        </p>
      ) : null}
    </form>
  );
}
