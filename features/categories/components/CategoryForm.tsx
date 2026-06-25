"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function CategoryForm({
  onSave,
}: {
  onSave: (
    name: string
  ) => Promise<void>;
}) {
  const [name, setName] =
    useState("");
  const [isSaving, setIsSaving] =
    useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
          await onSave(name);
        } finally {
          setIsSaving(false);
        }
      }}
      className="flex gap-4"
    >
      <input
        value={name}
        onChange={(e) =>
          setName(
            e.target.value
          )
        }
        placeholder="Category Name"
        className="border p-2 rounded"
      />

      <button
        type="submit"
        disabled={isSaving}
        aria-busy={isSaving}
        className="inline-flex items-center justify-center gap-2 rounded bg-black px-4 text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save"
        )}
      </button>
    </form>
  );
}
