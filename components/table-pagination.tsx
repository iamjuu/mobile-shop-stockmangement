"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalItems <= pageSize) {
    return (
      <div className="flex items-center justify-between border-t border-zinc-200 px-5 py-4 text-sm text-zinc-500">
        <span>
          Showing {totalItems} of {totalItems}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-5 py-4 text-sm">
      <p className="text-zinc-500">
        Showing {startItem}-{endItem} of {totalItems}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => {
            onPageChange(currentPage - 1);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-300"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-700">
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => {
            onPageChange(currentPage + 1);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-300"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
