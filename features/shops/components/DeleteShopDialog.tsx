"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  onDelete: () => Promise<void>;
}

export function DeleteShopDialog({
  onDelete,
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <button
      type="button"
      disabled={isDeleting}
      aria-busy={isDeleting}
      onClick={async () => {
        const ok =
          window.confirm(
            "Delete this shop?"
          );

        if (!ok) {
          return;
        }

        setIsDeleting(true);

        try {
          await onDelete();
        } finally {
          setIsDeleting(false);
        }
      }}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
    >
      {isDeleting ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Deleting...
        </>
      ) : (
        "Delete"
      )}
    </button>
  );
}
