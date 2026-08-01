"use client";

import { useMemo, useState } from "react";
import { Loader2, Pencil, X } from "lucide-react";

import { TablePagination } from "@/components/table-pagination";

interface CategoryItem {
  id: string;
  name: string;
  shopId?: string | null;
  shopName?: string | null;
  createdAt: string;
}

interface ShopOption {
  id: string;
  shopName: string;
}

interface CategoryDirectoryProps {
  categories: CategoryItem[];
  shops: ShopOption[];
  updateAction: (
    categoryId: string,
    data: {
      name: string;
      shopScope: "all" | "selected";
      shopIds: string[];
    }
  ) => Promise<{
    ok: boolean;
    message: string;
  }>;
}

const PAGE_SIZE = 7;

export function CategoryDirectory({
  categories,
  shops,
  updateAction,
}: CategoryDirectoryProps) {
  const [editCategory, setEditCategory] = useState<CategoryItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editAllShopsSelected, setEditAllShopsSelected] = useState(false);
  const [editSelectedShopIds, setEditSelectedShopIds] = useState<string[]>([]);
  const paginatedCategories = useMemo(
    () =>
      categories.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [categories, currentPage]
  );

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => {
      setToast(null);
    }, 2500);
  }

  function toggleEditAllShops() {
    setEditAllShopsSelected((current) => {
      const nextValue = !current;

      if (nextValue) {
        setEditSelectedShopIds([]);
      }

      return nextValue;
    });
  }

  function toggleEditShop(shopId: string) {
    setEditAllShopsSelected(false);
    setEditSelectedShopIds((currentShopIds) =>
      currentShopIds.includes(shopId)
        ? currentShopIds.filter((currentShopId) => currentShopId !== shopId)
        : [...currentShopIds, shopId]
    );
  }

  async function handleUpdate(formData: FormData) {
    if (!editCategory) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateAction(editCategory.id, {
        name: String(formData.get("name") ?? ""),
        shopScope: editAllShopsSelected ? "all" : "selected",
        shopIds: editSelectedShopIds,
      });

      showToast(result.message);

      if (result.ok) {
        setEditCategory(null);
        setEditAllShopsSelected(false);
        setEditSelectedShopIds([]);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">
              Category directory
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {categories.length} categories configured
            </p>
          </div>
        </div>

        <div className="scrollbar-hover overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Shop</th>
                <th className="px-5 py-4">Created</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 text-sm">
              {categories.length > 0 ? (
                paginatedCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="transition hover:bg-zinc-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700">
                          {category.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-zinc-950">
                            {category.name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            Product category
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                        {category.shopName ?? "All shops"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-zinc-600">
                      {category.createdAt}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Active
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                        onClick={() => {
                          setEditAllShopsSelected(!category.shopId);
                          setEditSelectedShopIds(
                            category.shopId ? [category.shopId] : []
                          );
                          setEditCategory(category);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-sm text-zinc-500"
                  >
                    No categories found. Create your first category to organize products.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          totalItems={categories.length}
          onPageChange={setCurrentPage}
        />
      </section>

      {editCategory ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-5">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Edit category
                </p>
                <h3 className="mt-1 text-2xl font-semibold">
                  {editCategory.name}
                </h3>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 hover:bg-zinc-50"
                onClick={() => {
                  setEditCategory(null);
                }}
                aria-label="Close edit category"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              action={handleUpdate}
              className="space-y-4 p-5"
            >
              <div>
                <label
                  htmlFor="editCategoryName"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Category name
                </label>
                <input
                  id="editCategoryName"
                  name="name"
                  defaultValue={editCategory.name}
                  required
                  className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
                />
              </div>

              <div>
                <p className="mb-2 block text-sm font-medium text-zinc-700">
                  Shop
                </p>

                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 transition hover:bg-zinc-50">
                    <input
                      type="checkbox"
                      checked={editAllShopsSelected}
                      onChange={toggleEditAllShops}
                      className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950"
                    />
                    <span className="text-sm font-medium text-zinc-900">
                      All shops
                    </span>
                  </label>

                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-[20px] border border-zinc-200 p-3">
                    {shops.map((shop) => {
                      const isChecked = editSelectedShopIds.includes(shop.id);

                      return (
                        <label
                          key={shop.id}
                          className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-zinc-50"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={editAllShopsSelected}
                            onChange={() => {
                              toggleEditShop(shop.id);
                            }}
                            className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 disabled:cursor-not-allowed"
                          />
                          <span className="text-sm text-zinc-700">
                            {shop.shopName}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
                  onClick={() => {
                    setEditCategory(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSaving ||
                    (!editAllShopsSelected && editSelectedShopIds.length === 0)
                  }
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
        <div className="fixed bottom-5 right-5 z-[60] rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      ) : null}
    </>
  );
}
