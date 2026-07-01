"use client";

import { useMemo, useState } from "react";

interface CategoryOption {
  id: string;
  name: string;
  shopName: string;
}

interface BrandCategoryPickerProps {
  categories: CategoryOption[];
  defaultCategoryIds?: string[];
  defaultAllCategories?: boolean;
}

export function BrandCategoryPicker({
  categories,
  defaultCategoryIds = [],
  defaultAllCategories = false,
}: BrandCategoryPickerProps) {
  const allCategoryIds = useMemo(
    () => categories.map((category) => category.id),
    [categories]
  );
  const [allSelected, setAllSelected] = useState(
    defaultAllCategories ||
      (defaultCategoryIds.length > 0 &&
        defaultCategoryIds.length === categories.length)
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(
    defaultAllCategories ? allCategoryIds : defaultCategoryIds
  );

  function toggleAll() {
    if (allSelected) {
      setAllSelected(false);
      setSelectedIds([]);
      return;
    }

    setAllSelected(true);
    setSelectedIds(allCategoryIds);
  }

  function toggleCategory(categoryId: string) {
    if (allSelected) {
      return;
    }

    setSelectedIds((current) => {
      if (current.includes(categoryId)) {
        return current.filter((id) => id !== categoryId);
      }

      return [...current, categoryId];
    });
  }

  const hasSelection = allSelected || selectedIds.length > 0;

  return (
    <div className="space-y-3">
      <input
        type="hidden"
        name="categoryScope"
        value={allSelected ? "all" : ""}
      />

      {allSelected
        ? allCategoryIds.map((categoryId) => (
            <input
              key={categoryId}
              type="hidden"
              name="categoryIds"
              value={categoryId}
            />
          ))
        : selectedIds.map((categoryId) => (
            <input
              key={categoryId}
              type="hidden"
              name="categoryIds"
              value={categoryId}
            />
          ))}

      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 transition hover:bg-zinc-50">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950"
        />
        <span className="text-sm font-medium text-zinc-900">All category</span>
      </label>

      <div className="max-h-48 space-y-2 overflow-y-auto rounded-[20px] border border-zinc-200 p-3">
        {categories.map((category) => {
          const isChecked =
            allSelected || selectedIds.includes(category.id);

          return (
            <label
              key={category.id}
              className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-zinc-50"
            >
              <input
                type="checkbox"
                checked={isChecked}
                disabled={allSelected}
                onChange={() => {
                  toggleCategory(category.id);
                }}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 disabled:cursor-not-allowed"
              />
              <span className="text-sm text-zinc-700">
                {category.name}
              </span>
            </label>
          );
        })}
      </div>

      {!hasSelection ? (
        <p className="text-sm text-red-600">Select at least one category.</p>
      ) : null}
    </div>
  );
}
