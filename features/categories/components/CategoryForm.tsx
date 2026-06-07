"use client";

import { useState } from "react";

export function CategoryForm({
  onSave,
}: {
  onSave: (
    name: string
  ) => Promise<void>;
}) {
  const [name, setName] =
    useState("");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSave(name);
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
        className="bg-black text-white px-4 rounded"
      >
        Save
      </button>
    </form>
  );
}