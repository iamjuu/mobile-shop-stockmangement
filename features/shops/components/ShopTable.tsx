"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { TablePagination } from "@/components/table-pagination";

import { ShopActions } from "./ShopActions";

interface Shop {
  id: string;
  shopName: string;
  shopCode: string;
  phone?: string | null;
}

interface Props {
  shops: Shop[];
}

const PAGE_SIZE = 7;

export function ShopTable({ shops }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const paginatedShops = useMemo(
    () => shops.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, shops]
  );

  return (
    <div className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-5 py-4">
        <h2 className="text-lg font-semibold">
          Shop directory
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Manage branch codes, contact details, and shop records.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-5 py-4">
                Name
              </th>
              <th className="px-5 py-4">
                Code
              </th>
              <th className="px-5 py-4">
                Phone
              </th>
              <th className="px-5 py-4 text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 text-sm">
            {shops.length > 0 ? (
              paginatedShops.map((shop) => (
                <tr
                  key={shop.id}
                  className="transition hover:bg-zinc-50"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold text-white">
                        {shop.shopName.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-950">
                          <Link
                            href={`/admin/shops/${shop.id}`}
                            className="hover:underline"
                          >
                            {shop.shopName}
                          </Link>
                        </p>
                        <p className="text-xs text-zinc-500">
                          Branch record
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                      {shop.shopCode}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-zinc-700">
                    {shop.phone || "Not added"}
                  </td>
                  <td className="px-5 py-4">
                    <ShopActions
                      id={shop.id}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-12 text-center text-sm text-zinc-500"
                >
                  No shops found. Add your first shop to start managing inventory.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <TablePagination
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        totalItems={shops.length}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
