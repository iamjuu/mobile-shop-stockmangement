"use client";

import { useMemo, useState } from "react";

import { TablePagination } from "@/components/table-pagination";

interface BrandItem {
  id: string;
  name: string;
  categoryName: string;
  shopName: string;
  createdAt: string;
}

interface BrandDirectoryProps {
  brands: BrandItem[];
}

const PAGE_SIZE = 7;

export function BrandDirectory({ brands }: BrandDirectoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const paginatedBrands = useMemo(
    () => brands.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [brands, currentPage]
  );

  return (
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
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-5 py-4">Name</th>
              <th className="px-5 py-4">Category</th>
              <th className="px-5 py-4">Shop</th>
              <th className="px-5 py-4">Created</th>
              <th className="px-5 py-4 text-right">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 text-sm">
            {brands.length > 0 ? (
              paginatedBrands.map((brand) => (
                <tr key={brand.id} className="transition hover:bg-zinc-50">
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
                    <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                      {brand.categoryName}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-zinc-600">
                    {brand.shopName}
                  </td>
                  <td className="px-5 py-4 text-zinc-600">
                    {brand.createdAt}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Active
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
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
  );
}
