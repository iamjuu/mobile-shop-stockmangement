"use client";

import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import type {
  ProductFormValues,
} from "../schemas/product.schema";

interface ProductShopOption {
  id: string;
  shopName: string;
}

interface ProductCategoryOption {
  id: string;
  name: string;
}

interface ProductFormProps {
  shops: ProductShopOption[];
  categories: ProductCategoryOption[];
  subcategories: ProductCategoryOption[];
  onSubmit: (data: ProductFormValues) => Promise<void>;
}

export function ProductForm({
  shops,
  categories,
  subcategories,
  onSubmit,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: {
      isSubmitting,
    },
  } = useForm<ProductFormValues>();

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 max-w-2xl"
    >
      <input
        {...register("productName")}
        placeholder="Product Name"
        className="border p-3 w-full rounded"
      />

      <select
        {...register("shopId")}
        className="border p-3 w-full rounded"
      >
        {shops.map(
          (shop) => (
            <option
              key={shop.id}
              value={shop.id}
            >
              {shop.shopName}
            </option>
          )
        )}
      </select>

      <select
        {...register("categoryId")}
        className="border p-3 w-full rounded"
      >
        {categories.map(
          (category) => (
            <option
              key={category.id}
              value={category.id}
            >
              {category.name}
            </option>
          )
        )}
      </select>

      <select
        {...register(
          "subcategoryId"
        )}
        className="border p-3 w-full rounded"
      >
        {subcategories.map(
          (subcategory) => (
            <option
              key={
                subcategory.id
              }
              value={
                subcategory.id
              }
            >
              {subcategory.name}
            </option>
          )
        )}
      </select>

      <input
        {...register("price")}
        type="number"
        placeholder="Price"
        className="border p-3 w-full rounded"
      />

      <input
        {...register("stock")}
        type="number"
        placeholder="Stock"
        className="border p-3 w-full rounded"
      />

      <textarea
        {...register(
          "description"
        )}
        placeholder="Description"
        className="border p-3 w-full rounded"
      />

      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="inline-flex items-center justify-center gap-2 rounded bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving product...
          </>
        ) : (
          "Save Product"
        )}
      </button>
    </form>
  );
}
