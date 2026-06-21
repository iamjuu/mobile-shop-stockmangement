"use client";

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
        className="bg-black text-white px-4 py-2 rounded"
      >
        Save Shop
      </button>
    </form>
  );
}
