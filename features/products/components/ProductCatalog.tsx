"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import { TablePagination } from "@/components/table-pagination";

interface ProductCatalogCategory {
  id: string;
  name: string;
  shopName: string;
  productCount: number;
}

interface ProductCatalogItem {
  id: string;
  productCode: string;
  productName: string;
  categoryId: string;
  shopName: string;
  brandName: string;
  price: number;
  stock: number;
  source: string;
  mainImageUrl?: string | null;
}

interface ProductCatalogProps {
  categories: ProductCatalogCategory[];
  products: ProductCatalogItem[];
}

const PAGE_SIZE = 7;
const currency = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  style: "currency",
});

export function ProductCatalog({
  categories,
  products,
}: ProductCatalogProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categories[0]?.id ?? ""
  );
  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ?? null;
  const paginatedCategories = useMemo(
    () =>
      categories.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [categories, currentPage]
  );
  const selectedProducts = useMemo(
    () =>
      products.filter((product) => product.categoryId === selectedCategoryId),
    [products, selectedCategoryId]
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-semibold">Category list</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Click a category to view products.
          </p>
        </div>

        <div className="divide-y divide-zinc-100">
          {categories.length > 0 ? (
            paginatedCategories.map((category) => {
              const isSelected = category.id === selectedCategoryId;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId(category.id);
                  }}
                  className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition ${
                    isSelected ? "bg-zinc-950 text-white" : "hover:bg-zinc-50"
                  }`}
                >
                  <div>
                    <p className="font-semibold">{category.name}</p>
                    <p
                      className={`mt-1 text-sm ${
                        isSelected ? "text-zinc-300" : "text-zinc-500"
                      }`}
                    >
                      {category.shopName}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isSelected
                        ? "bg-white text-zinc-950"
                        : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {category.productCount} products
                  </span>
                </button>
              );
            })
          ) : (
            <div className="px-5 py-12 text-center text-sm text-zinc-500">
              No categories found.
            </div>
          )}
        </div>

        <TablePagination
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          totalItems={categories.length}
          onPageChange={setCurrentPage}
        />
      </section>

      <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-semibold">
            {selectedCategory?.name ?? "Products"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {selectedProducts.length} products in this category
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Shop</th>
                <th className="px-5 py-4">Brand</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4">Source</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 text-sm">
              {selectedProducts.length > 0 ? (
                selectedProducts.map((product) => (
                  <tr key={product.id} className="transition hover:bg-zinc-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {product.mainImageUrl ? (
                          <div className="size-12 shrink-0 overflow-hidden rounded-2xl bg-zinc-100">
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
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-sm font-semibold text-white">
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
                    <td className="px-5 py-4 text-zinc-700">
                      {product.shopName}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                        {product.brandName}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold">
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
                    <td className="px-5 py-4 text-zinc-700">
                      {product.source === "EXCHANGE_THIRD_PARTY"
                        ? "Exchange"
                        : "Regular"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-zinc-500"
                  >
                    No products found for this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
