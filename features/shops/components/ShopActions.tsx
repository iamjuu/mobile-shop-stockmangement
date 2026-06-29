"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { deleteShopAction } from "../actions/delete-shop";
import { DeleteShopDialog } from "./DeleteShopDialog";

export function ShopActions({
  id,
}: {
  id: string;
}) {
  const router = useRouter();
  const [isViewing, setIsViewing] = useState(false);

  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        disabled={isViewing}
        aria-busy={isViewing}
        onClick={() => {
          setIsViewing(true);
          router.push(`/admin/shops/${id}`);
        }}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
      >
        {isViewing ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Opening...
          </>
        ) : (
          "View"
        )}
      </button>

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
