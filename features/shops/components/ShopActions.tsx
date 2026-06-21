"use client";

import Link from "next/link";

import { deleteShopAction } from "../actions/delete-shop";
import { DeleteShopDialog } from "./DeleteShopDialog";

export function ShopActions({
  id,
}: {
  id: string;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Link
        href={`/admin/shops/${id}/edit`}
        className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
      >
        Edit
      </Link>

      <DeleteShopDialog
        onDelete={async () => {
          await deleteShopAction(id);
        }}
      />
    </div>
  );
}
