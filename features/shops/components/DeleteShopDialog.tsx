"use client";

interface Props {
  onDelete: () => void;
}

export function DeleteShopDialog({
  onDelete,
}: Props) {
  return (
    <button
      onClick={() => {
        const ok =
          window.confirm(
            "Delete this shop?"
          );

        if (ok) {
          onDelete();
        }
      }}
      className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
    >
      Delete
    </button>
  );
}
