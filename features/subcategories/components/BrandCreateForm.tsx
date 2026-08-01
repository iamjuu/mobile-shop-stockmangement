"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { PendingSubmitButton } from "@/components/pending-submit-button";
import { BrandCategoryPicker } from "@/features/subcategories/components/BrandCategoryPicker";

interface CategoryOption {
  id: string;
  name: string;
  shopName: string;
}

export interface BrandCreateState {
  ok: boolean;
  message: string;
}

interface BrandCreateFormProps {
  categories: CategoryOption[];
  action: (
    state: BrandCreateState,
    formData: FormData
  ) => Promise<BrandCreateState>;
}

const initialState: BrandCreateState = {
  ok: false,
  message: "",
};

export function BrandCreateForm({
  categories,
  action,
}: BrandCreateFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!state.message || !state.ok) {
      return;
    }

    const effectTimer = window.setTimeout(() => {
      setToast(state.message);
      formRef.current?.reset();

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2500);
    }, 0);

    return () => {
      window.clearTimeout(effectTimer);
    };
  }, [state]);

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        className="mt-6 space-y-4"
      >
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            Brand name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Example: Mobiles"
            className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700">
            Category
          </label>
          <BrandCategoryPicker categories={categories} />
        </div>

        <PendingSubmitButton
          disabled={categories.length === 0}
          pendingLabel="Creating brand..."
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Create Brand
        </PendingSubmitButton>

        {state.message && !state.ok ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {state.message}
          </p>
        ) : null}

        {categories.length === 0 ? (
          <p className="text-sm text-red-600">
            Create a category before adding brands.
          </p>
        ) : null}
      </form>

      {toast ? (
        <div className="fixed right-5 top-5 z-[60] rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      ) : null}
    </>
  );
}
