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
    <div className="flex gap-4">
      <Link
        href={`/shops/${id}/edit`}
        className="text-blue-600"
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