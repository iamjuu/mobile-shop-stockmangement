"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { TablePagination } from "@/components/table-pagination";
import { QRPreview } from "./QRPreview";

interface ProductCatalogCategory {
  id: string;
  name: string;
  shopName: string;
  productCount: number;
}

interface SubcategoryOption {
  id: string;
  name: string;
  categoryId: string;
}

interface ProductCatalogItem {
  id: string;
  productCode: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  shopName: string;
  brandName: string;
  purchasePrice?: number | null;
  price: number;
  stock: number;
  source: string;
  imeiNumber?: string | null;
  mainImageUrl?: string | null;
  galleryImageUrls?: string[];
  description?: string | null;
}

type ProductShopSummary = {
  shopName: string;
  stock: number;
  recordCount: number;
};

type ProductCatalogRow = ProductCatalogItem & {
  recordCount: number;
  shopSummaries: ProductShopSummary[];
};

interface ProductCatalogProps {
  categories: ProductCatalogCategory[];
  products: ProductCatalogItem[];
  subcategories?: SubcategoryOption[];
  updateAction?: (
    productId: string,
    data: {
      productName: string;
      subcategoryId: string;
      purchasePrice: number;
      price: number;
      stock: number;
      description?: string;
    }
  ) => Promise<{
    ok: boolean;
    message: string;
  }>;
  deleteAction?: (productId: string) => Promise<{
    ok: boolean;
    message: string;
  }>;
}

const PAGE_SIZE = 7;
const currency = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  style: "currency",
});

function getInitialCategoryId(categories: ProductCatalogCategory[]) {
  return (
    categories.find((category) => category.productCount > 0)?.id ??
    categories[0]?.id ??
    ""
  );
}

function getProductGroupKey(product: ProductCatalogItem) {
  return [
    product.source,
    product.productName.trim().toLowerCase(),
    product.categoryName,
    product.brandName,
    product.price,
  ].join("|");
}

function mergeShopSummary(
  shopSummaries: ProductCatalogRow["shopSummaries"],
  product: ProductCatalogItem
) {
  const summary = shopSummaries.find(
    (shopSummary) => shopSummary.shopName === product.shopName
  );

  if (summary) {
    return shopSummaries.map((shopSummary) =>
      shopSummary.shopName === product.shopName
        ? {
            ...shopSummary,
            stock: shopSummary.stock + product.stock,
            recordCount: shopSummary.recordCount + 1,
          }
        : shopSummary
    );
  }

  return [
    ...shopSummaries,
    {
      shopName: product.shopName,
      stock: product.stock,
      recordCount: 1,
    },
  ];
}

function groupProducts(products: ProductCatalogItem[]) {
  const groupedProducts = new Map<string, ProductCatalogRow>();

  products.forEach((product) => {
    const groupKey =
      product.source === "EXCHANGE_THIRD_PARTY"
        ? product.id
        : getProductGroupKey(product);
    const existingProduct = groupedProducts.get(groupKey);

    if (!existingProduct) {
      groupedProducts.set(groupKey, {
        ...product,
        recordCount: 1,
        shopSummaries: [
          {
            shopName: product.shopName,
            stock: product.stock,
            recordCount: 1,
          },
        ],
      });
      return;
    }

    groupedProducts.set(groupKey, {
      ...existingProduct,
      stock: existingProduct.stock + product.stock,
      recordCount: existingProduct.recordCount + 1,
      shopSummaries: mergeShopSummary(
        existingProduct.shopSummaries,
        product
      ).sort((a, b) => b.stock - a.stock),
    });
  });

  return Array.from(groupedProducts.values());
}

export function ProductCatalog({
  categories,
  products,
  subcategories = [],
  updateAction,
  deleteAction,
}: ProductCatalogProps) {
  const router = useRouter();
  const qrRef = useRef<HTMLDivElement>(null);
  const canManageProducts = Boolean(updateAction && deleteAction);
  const [localProducts, setLocalProducts] = useState(products);
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("ALL");
  const [selectedProduct, setSelectedProduct] =
    useState<ProductCatalogRow | null>(null);
  const [editProduct, setEditProduct] =
    useState<ProductCatalogItem | null>(null);
  const [deleteProduct, setDeleteProduct] =
    useState<ProductCatalogItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    getInitialCategoryId(categories)
  );
  const editBrandOptions = useMemo(
    () =>
      editProduct
        ? subcategories.filter(
            (subcategory) => subcategory.categoryId === editProduct.categoryId
          )
        : [],
    [editProduct, subcategories]
  );
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();

    categories.forEach((category) => {
      counts.set(
        category.id,
        groupProducts(
          localProducts.filter((product) => product.categoryId === category.id)
        ).length
      );
    });

    return counts;
  }, [categories, localProducts]);
  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ?? null;
  const isMobileCategory =
    selectedCategory?.name.trim().toLowerCase() === "mobile";
  const filteredCategories = useMemo(() => {
    const normalizedQuery = categoryQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return categories;
    }

    return categories.filter((category) =>
      [category.name, category.shopName]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [categories, categoryQuery]);
  const paginatedCategories = useMemo(
    () =>
      filteredCategories.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [filteredCategories, currentPage]
  );
  const brandOptions = useMemo(
    () =>
      Array.from(
        new Set(
          localProducts
            .filter((product) => product.categoryId === selectedCategoryId)
            .map((product) => product.brandName)
        )
      ).sort((first, second) => first.localeCompare(second)),
    [localProducts, selectedCategoryId]
  );
  const selectedProducts = useMemo(() => {
    const normalizedQuery = productQuery.trim().toLowerCase();

    const filteredProducts = localProducts.filter((product) => {
      const matchesCategory = product.categoryId === selectedCategoryId;
      const matchesBrand =
        !isMobileCategory ||
        brandFilter === "ALL" ||
        product.brandName === brandFilter;
      const matchesQuery =
        !normalizedQuery ||
        [
          product.productName,
          product.productCode,
          product.categoryName,
          product.brandName,
          product.imeiNumber ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesBrand && matchesQuery;
    });

    return groupProducts(filteredProducts);
  }, [
    brandFilter,
    isMobileCategory,
    localProducts,
    productQuery,
    selectedCategoryId,
  ]);
  const selectedProductShopLabel = selectedProduct?.shopSummaries.length
    ? selectedProduct.shopSummaries.length === 1
      ? selectedProduct.shopSummaries[0].shopName
      : `${selectedProduct.shopSummaries.length - 1}+`
    : selectedProduct?.shopName ?? "";
  const qrValue = useMemo(() => {
    if (!selectedProduct) {
      return "";
    }

    return JSON.stringify({
      code: selectedProduct.productCode,
      name: selectedProduct.productName,
      shop: selectedProductShopLabel,
      category: selectedProduct.categoryName,
      subcategory: selectedProduct.brandName,
      purchasePrice: selectedProduct.purchasePrice ?? 0,
      price: selectedProduct.price,
      profitPerSale:
        selectedProduct.price - (selectedProduct.purchasePrice ?? 0),
      stock: selectedProduct.stock,
    });
  }, [selectedProduct, selectedProductShopLabel]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => {
      setToast(null);
    }, 2500);
  }

  async function handleUpdate(formData: FormData) {
    if (!editProduct || !updateAction) {
      return;
    }

    setIsSaving(true);

    try {
      const subcategoryId = String(formData.get("subcategoryId") ?? "");
      const selectedBrand = subcategories.find(
        (subcategory) => subcategory.id === subcategoryId
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

      showToast(result.message);

      if (result.ok) {
        const brandName = selectedBrand?.name ?? editProduct.brandName;
        setLocalProducts((currentProducts) =>
          currentProducts.map((product) =>
            product.id === editProduct.id
              ? {
                  ...product,
                  ...updatedProduct,
                  productName: updatedProduct.productName.trim(),
                  brandName,
                  stock: Math.trunc(updatedProduct.stock),
                  description: updatedProduct.description.trim() || null,
                }
              : product
          )
        );
        setSelectedProduct((currentProduct) =>
          currentProduct?.id === editProduct.id
            ? {
                ...currentProduct,
                ...updatedProduct,
                productName: updatedProduct.productName.trim(),
                brandName,
                stock: Math.trunc(updatedProduct.stock),
                description: updatedProduct.description.trim() || null,
              }
            : currentProduct
        );
        setEditProduct(null);
        router.refresh();
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteProduct || !deleteAction) {
      return;
    }

    setDeletingProductId(deleteProduct.id);

    try {
      const result = await deleteAction(deleteProduct.id);

      showToast(result.message);

      if (result.ok) {
        setLocalProducts((currentProducts) =>
          currentProducts.filter((product) => product.id !== deleteProduct.id)
        );
        setSelectedProduct((currentProduct) =>
          currentProduct?.id === deleteProduct.id ? null : currentProduct
        );
        setEditProduct((currentProduct) =>
          currentProduct?.id === deleteProduct.id ? null : currentProduct
        );
        setDeleteProduct(null);
        router.refresh();
      }
    } finally {
      setDeletingProductId(null);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-semibold">Category list</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Click a category to view products.
          </p>
          <input
            value={categoryQuery}
            onChange={(event) => {
              setCategoryQuery(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search category"
            className="mt-4 w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
          />
        </div>

        <div className="divide-y divide-zinc-100">
          {filteredCategories.length > 0 ? (
            paginatedCategories.map((category) => {
              const isSelected = category.id === selectedCategoryId;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId(category.id);
                    setBrandFilter("ALL");
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
                    {categoryCounts.get(category.id) ?? 0} products
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
          totalItems={filteredCategories.length}
          onPageChange={setCurrentPage}
        />
      </section>

      <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">
              {selectedCategory?.name ?? "Products"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {selectedProducts.length} products in this category
            </p>
          </div>

          <div
            className={`grid w-full gap-3 sm:w-auto ${
              isMobileCategory ? "sm:grid-cols-[260px_180px]" : "sm:w-[320px]"
            }`}
          >
            <input
              value={productQuery}
              onChange={(event) => {
                setProductQuery(event.target.value);
              }}
              placeholder="Search name, category, IMEI"
              className="rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
            />
            {isMobileCategory ? (
              <select
                value={brandFilter}
                onChange={(event) => {
                  setBrandFilter(event.target.value);
                }}
                className="rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-950"
              >
                <option value="ALL">All brands</option>
                {brandOptions.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </div>

        <div className="scrollbar-hover overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-left">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Shop</th>
                <th className="px-5 py-4">Brand</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4">Source</th>
                {canManageProducts ? (
                  <th className="px-5 py-4 text-right">Action</th>
                ) : null}
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 text-sm">
              {selectedProducts.length > 0 ? (
                selectedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="cursor-pointer transition hover:bg-zinc-50"
                    onClick={() => {
                      setSelectedProduct(product);
                    }}
                  >
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
                          {product.imeiNumber ? (
                            <p className="text-xs text-zinc-500">
                              IMEI {product.imeiNumber}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-zinc-700">
                      <div className="relative inline-flex">
                        {product.shopSummaries.length === 1 ? (
                          <span>{product.shopSummaries[0].shopName}</span>
                        ) : (
                          <div className="group relative">
                            <span
                              className="inline-flex cursor-default rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700"
                              title={product.shopSummaries
                                .map((shop) => `${shop.shopName}: ${shop.stock}`)
                                .join("\n")}
                            >
                              {product.shopSummaries.length - 1}+
                            </span>

                            <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-48 rounded-md border border-zinc-200 bg-white p-2 text-xs text-zinc-700 opacity-0 shadow-lg transition group-hover:opacity-100">
                              <p className="mb-1 font-semibold text-zinc-950">
                                {product.shopSummaries.length} shops
                              </p>
                              <div className="space-y-1">
                                {product.shopSummaries.map((shop) => (
                                  <div
                                    key={shop.shopName}
                                    className="flex items-center justify-between gap-3"
                                  >
                                    <span className="truncate">
                                      {shop.shopName}
                                    </span>
                                    <span className="shrink-0 font-semibold text-zinc-950">
                                      {shop.stock}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
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
                    {canManageProducts ? (
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditProduct(product);
                            }}
                            aria-label={`Edit ${product.productName}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={deletingProductId === product.id}
                            aria-busy={deletingProductId === product.id}
                            className="inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-zinc-400"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteProduct(product);
                            }}
                            aria-label={`Delete ${product.productName}`}
                          >
                            {deletingProductId === product.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={canManageProducts ? 7 : 6}
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

      {selectedProduct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-[10px] backdrop-blur-xs sm:p-4">
          <div className="scrollbar-hidden max-h-[calc(100dvh-20px)] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white shadow-2xl sm:max-h-[calc(100vh-2rem)]">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-5">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Product QR details
                </p>
                <h3 className="mt-1 text-2xl font-semibold">
                  {selectedProduct.productName}
                </h3>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 hover:bg-zinc-50"
                onClick={() => {
                  setSelectedProduct(null);
                }}
                aria-label="Close product QR"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 p-5 md:grid-cols-[260px_1fr]">
              <div className="flex flex-col items-center justify-center rounded-[24px] bg-zinc-50 p-6">
                {selectedProduct.mainImageUrl ? (
                  <Image
                    src={selectedProduct.mainImageUrl}
                    alt={selectedProduct.productName}
                    width={180}
                    height={180}
                    unoptimized
                    className="mb-5 aspect-square w-full max-w-[180px] rounded-3xl object-cover"
                  />
                ) : null}
                <div ref={qrRef} className="rounded-2xl bg-white p-4">
                  <QRPreview value={qrValue} />
                </div>
                <p className="mt-4 text-center text-xs font-medium text-zinc-500">
                  Scan to read product details
                </p>
              </div>

              <div className="space-y-3">
                {selectedProduct.galleryImageUrls?.length ? (
                  <div className="grid grid-cols-3 gap-3">
                    {selectedProduct.galleryImageUrls.map((imageUrl, index) => (
                      <Image
                        key={imageUrl}
                        src={imageUrl}
                        alt={`${selectedProduct.productName} ${index + 1}`}
                        width={120}
                        height={120}
                        unoptimized
                        className="aspect-square rounded-2xl object-cover"
                      />
                    ))}
                  </div>
                ) : null}

                {[
                  ["Product Code", selectedProduct.productCode],
                  [
                    "Source",
                    selectedProduct.source === "EXCHANGE_THIRD_PARTY"
                      ? "Exchange"
                      : "Regular",
                  ],
                  ["Shop", selectedProductShopLabel],
                  ["Category", selectedProduct.categoryName],
                  ["Brand", selectedProduct.brandName],
                  ...(canManageProducts
                    ? [
                        [
                          "Purchase Price",
                          currency.format(selectedProduct.purchasePrice ?? 0),
                        ],
                      ]
                    : []),
                  ["Selling Price", currency.format(selectedProduct.price)],
                  ...(canManageProducts
                    ? [
                        [
                          "Profit Per Sale",
                          currency.format(
                            selectedProduct.price -
                              (selectedProduct.purchasePrice ?? 0)
                          ),
                        ],
                      ]
                    : []),
                  ["Stock", `${selectedProduct.stock} units`],
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

                {selectedProduct.description ? (
                  <div className="rounded-2xl bg-zinc-50 px-4 py-3">
                    <p className="text-sm text-zinc-500">Description</p>
                    <p className="mt-1 text-sm font-medium text-zinc-950">
                      {selectedProduct.description}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editProduct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-[10px] backdrop-blur-sm sm:p-4">
          <div className="scrollbar-hidden max-h-[calc(100dvh-20px)] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white shadow-2xl sm:max-h-[calc(100vh-2rem)]">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-5">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Edit product
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
                aria-label="Close edit product"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={handleUpdate} className="space-y-4 p-5">
              <div>
                <label
                  htmlFor="catalogEditProductName"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Product name
                </label>
                <input
                  id="catalogEditProductName"
                  name="productName"
                  defaultValue={editProduct.productName}
                  required
                  className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
                />
              </div>

              {editBrandOptions.length > 0 ? (
                <div>
                  <label
                    htmlFor="catalogEditSubcategoryId"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Brand
                  </label>
                  <select
                    id="catalogEditSubcategoryId"
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
                    htmlFor="catalogEditPurchasePrice"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Purchase price
                  </label>
                  <input
                    id="catalogEditPurchasePrice"
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
                    htmlFor="catalogEditPrice"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Selling price
                  </label>
                  <input
                    id="catalogEditPrice"
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
                    htmlFor="catalogEditStock"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Stock
                  </label>
                  <input
                    id="catalogEditStock"
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
                  htmlFor="catalogEditDescription"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Description
                </label>
                <textarea
                  id="catalogEditDescription"
                  name="description"
                  defaultValue={editProduct.description ?? ""}
                  rows={4}
                  className="w-full rounded-3xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
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
                    "Save changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteProduct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-[10px] backdrop-blur-sm sm:p-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Delete product
                </p>
                <h3 className="mt-1 text-2xl font-semibold">
                  Are you sure?
                </h3>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 hover:bg-zinc-50"
                onClick={() => {
                  setDeleteProduct(null);
                }}
                aria-label="Close delete product"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-600">
              Delete {deleteProduct.productName}? This action cannot be undone.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
                onClick={() => {
                  setDeleteProduct(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingProductId === deleteProduct.id}
                aria-busy={deletingProductId === deleteProduct.id}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
                onClick={handleDelete}
              >
                {deletingProductId === deleteProduct.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
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
    </div>
  );
}
