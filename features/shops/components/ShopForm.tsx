"use client";

import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

export interface ShopFormValues {
  shopName: string;
  shopCode: string;
  address?: string;
  phone?: string;
  description?: string;
}

interface ShopFormProps {
  defaultValues?: ShopFormValues;
  onSubmit: (data: ShopFormValues) => Promise<void>;
}

export function ShopForm({
  defaultValues,
  onSubmit,
}: ShopFormProps) {
  const {
    register,
    handleSubmit,
    formState: {
      isSubmitting,
    },
  } = useForm<ShopFormValues>({
    defaultValues,
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 max-w-xl"
    >
      <input
        {...register("shopName")}
        placeholder="Shop Name"
        className="border rounded w-full p-3"
      />

      <input
        {...register("shopCode")}
        placeholder="Shop Code"
        className="border rounded w-full p-3"
      />

      <input
        {...register("address")}
        placeholder="Address"
        className="border rounded w-full p-3"
      />

      <input
        {...register("phone")}
        placeholder="Phone"
        className="border rounded w-full p-3"
      />

      <textarea
        {...register("description")}
        placeholder="Description"
        className="border rounded w-full p-3"
      />

      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="inline-flex items-center justify-center gap-2 rounded bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving shop...
          </>
        ) : (
          "Save Shop"
        )}
      </button>
    </form>
  );
}
