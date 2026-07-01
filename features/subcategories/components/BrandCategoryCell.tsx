"use client";

import { useEffect, useRef, useState } from "react";

interface BrandCategory {
  id: string;
  name: string;
}

interface BrandCategoryCellProps {
  categories: BrandCategory[];
  isAllCategories: boolean;
}

export function BrandCategoryCell({
  categories,
  isAllCategories,
}: BrandCategoryCellProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  if (isAllCategories) {
    return (
      <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
        All category
      </span>
    );
  }

  if (categories.length === 1) {
    return (
      <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
        {categories[0].name}
      </span>
    );
  }

  const remainingCount = categories.length - 1;

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
        }}
        className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200"
      >
        <span>{categories[0].name}</span>
        <span className="text-zinc-500">+{remainingCount}</span>
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-20 mt-2 min-w-[180px] rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
          {categories.map((category) => (
            <p
              key={category.id}
              className="rounded-xl px-3 py-2 text-xs font-medium text-zinc-700"
            >
              {category.name}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
