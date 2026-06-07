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
      className="text-red-600"
    >
      Delete
    </button>
  );
}