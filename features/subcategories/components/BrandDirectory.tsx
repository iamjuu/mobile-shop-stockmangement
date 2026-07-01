"use client";

import { useMemo, useState } from "react";
import { Loader2, Pencil, Trash2, X } from "lucide-react";

import { TablePagination } from "@/components/table-pagination";
import { BrandCategoryCell } from "@/features/subcategories/components/BrandCategoryCell";
import { BrandCategoryPicker } from "@/features/subcategories/components/BrandCategoryPicker";

interface BrandCategory {
  id: string;
  name: string;
  shopName: string;
}

interface BrandItem {
  ids: string[];
  name: string;
  categories: BrandCategory[];
  isAllCategories: boolean;
  shopName: string;
  createdAt: string;
}

interface CategoryOption {
  id: string;
  name: string;
  shopName: string;
}

interface BrandDirectoryProps {
  brands: BrandItem[];
  categories: CategoryOption[];
  totalCategoryCount: number;
  updateAction: (
    subcategoryIds: string[],
    data: {
      name: string;
      categoryIds: string[];
    }
  ) => Promise<{
    ok: boolean;
    message: string;
  }>;
  deleteAction: (subcategoryIds: string[]) => Promise<{
    ok: boolean;
    message: string;
  }>;
}

const PAGE_SIZE = 7;

export function BrandDirectory({
  brands,
  categories,
  totalCategoryCount,
  updateAction,
  deleteAction,
}: BrandDirectoryProps) {
  const [editBrand, setEditBrand] = useState<BrandItem | null>(null);
  const [deleteBrand, setDeleteBrand] = useState<BrandItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const paginatedBrands = useMemo(
    () => brands.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [brands, currentPage]
  );

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => {
      setToast(null);
    }, 2500);
  }

  async function handleUpdate(formData: FormData) {
    if (!editBrand) {
      return;
    }

    setIsSaving(true);

    try {
      const categoryScope = String(formData.get("categoryScope") ?? "");
      const categoryIds =
        categoryScope === "all"
          ? categories.map((category) => category.id)
          : formData.getAll("categoryIds").map((value) => String(value));

      const result = await updateAction(editBrand.ids, {
        name: String(formData.get("name") ?? ""),
        categoryIds,
      });

      showToast(result.message);

      if (result.ok) {
        setEditBrand(null);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteBrand) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteAction(deleteBrand.ids);

      showToast(result.message);

      if (result.ok) {
        setDeleteBrand(null);
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
    <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold">Brand directory</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {brands.length} brands configured
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-5 py-4">Name</th>
              <th className="px-5 py-4">Category</th>
              <th className="px-5 py-4">Shop</th>
              <th className="px-5 py-4">Created</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 text-sm">
            {brands.length > 0 ? (
              paginatedBrands.map((brand) => (
                <tr key={brand.ids.join("-")} className="transition hover:bg-zinc-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700">
                        {brand.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-950">
                          {brand.name}
                        </p>
                        <p className="text-xs text-zinc-500">Product brand</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <BrandCategoryCell
                      categories={brand.categories}
                      isAllCategories={brand.isAllCategories}
                    />
                  </td>
                  <td className="px-5 py-4 text-zinc-600">
                    {brand.shopName}
                  </td>
                  <td className="px-5 py-4 text-zinc-600">
                    {brand.createdAt}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Active
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                        onClick={() => {
                          setEditBrand(brand);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setDeleteBrand(brand);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-sm text-zinc-500"
                >
                  No brands found. Add one under an existing category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        totalItems={brands.length}
        onPageChange={setCurrentPage}
      />
    </section>
    
    {editBrand ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
        <div className="w-full max-w-xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-5">
            <div>
              <p className="text-sm font-medium text-zinc-500">Edit brand</p>
              <h3 className="mt-1 text-2xl font-semibold">{editBrand.name}</h3>
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 hover:bg-zinc-50"
              onClick={() => {
                setEditBrand(null);
              }}
              aria-label="Close edit brand"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form action={handleUpdate} className="space-y-4 p-5">
            <div>
              <label
                htmlFor="editBrandName"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Brand name
              </label>
              <input
                id="editBrandName"
                name="name"
                defaultValue={editBrand.name}
                required
                className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Category
              </label>
              <BrandCategoryPicker
                categories={categories}
                defaultCategoryIds={editBrand.categories.map(
                  (category) => category.id
                )}
                defaultAllCategories={
                  editBrand.isAllCategories &&
                  editBrand.categories.length === totalCategoryCount
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
                onClick={() => {
                  setEditBrand(null);
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

    {deleteBrand ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-500">Delete brand</p>
              <h3 className="mt-1 text-2xl font-semibold">{deleteBrand.name}</h3>
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 hover:bg-zinc-50"
              onClick={() => {
                setDeleteBrand(null);
              }}
              aria-label="Close delete brand"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-600">
            This will delete the brand from all selected categories if no products are using it.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
              onClick={() => {
                setDeleteBrand(null);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              aria-busy={isDeleting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
              onClick={handleDelete}
            >
              {isDeleting ? (
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
      <div className="fixed bottom-5 right-5 z-[60] rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white shadow-xl">
        {toast}
      </div>
    ) : null}
    </>
  );
}
