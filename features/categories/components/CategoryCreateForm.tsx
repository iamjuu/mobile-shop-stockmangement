"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { PendingSubmitButton } from "@/components/pending-submit-button";

interface ShopOption {
  id: string;
  shopName: string;
}

export interface CategoryCreateState {
  ok: boolean;
  message: string;
}

interface CategoryCreateFormProps {
  shops: ShopOption[];
  action: (
    state: CategoryCreateState,
    formData: FormData
  ) => Promise<CategoryCreateState>;
}

const initialState: CategoryCreateState = {
  ok: false,
  message: "",
};

export function CategoryCreateForm({
  shops,
  action,
}: CategoryCreateFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [allShopsSelected, setAllShopsSelected] = useState(true);
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!state.message) {
      return;
    }

    if (!state.ok) {
      return;
    }

    const effectTimer = window.setTimeout(() => {
      setToast(state.message);

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2500);

      formRef.current?.reset();
      setAllShopsSelected(true);
      setSelectedShopIds([]);
    }, 0);

    return () => {
      window.clearTimeout(effectTimer);
    };
  }, [state]);

  const hasShopSelection = allShopsSelected || selectedShopIds.length > 0;

  function toggleAllShops() {
    setAllShopsSelected((current) => {
      const nextValue = !current;

      if (nextValue) {
        setSelectedShopIds([]);
      }

      return nextValue;
    });
  }

  function toggleShop(shopId: string) {
    setAllShopsSelected(false);
    setSelectedShopIds((currentShopIds) =>
      currentShopIds.includes(shopId)
        ? currentShopIds.filter((currentShopId) => currentShopId !== shopId)
        : [...currentShopIds, shopId]
    );
  }

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        className="mt-6 space-y-4"
      >
        <input
          type="hidden"
          name="shopScope"
          value={allShopsSelected ? "all" : "selected"}
        />

        {selectedShopIds.map((shopId) => (
          <input
            key={shopId}
            type="hidden"
            name="shopIds"
            value={shopId}
          />
        ))}

        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            Category name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Example: Electronics"
            className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
          />
        </div>

        <div>
          <p className="mb-2 block text-sm font-medium text-zinc-700">
            Shop
          </p>

          <div className="space-y-3">
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 transition hover:bg-zinc-50">
              <input
                type="checkbox"
                checked={allShopsSelected}
                onChange={toggleAllShops}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950"
              />
              <span className="text-sm font-medium text-zinc-900">
                All shops
              </span>
            </label>

            <div className="max-h-56 space-y-2 overflow-y-auto rounded-[20px] border border-zinc-200 p-3">
              {shops.length > 0 ? (
                shops.map((shop) => {
                  const isChecked = selectedShopIds.includes(shop.id);

                  return (
                    <label
                      key={shop.id}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-zinc-50"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={allShopsSelected}
                        onChange={() => {
                          toggleShop(shop.id);
                        }}
                        className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-zinc-700">
                        {shop.shopName}
                      </span>
                    </label>
                  );
                })
              ) : (
                <p className="px-3 py-2 text-sm text-zinc-500">
                  No shops created yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <PendingSubmitButton
          disabled={!hasShopSelection}
          pendingLabel="Creating category..."
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Create Category
        </PendingSubmitButton>

        {!hasShopSelection ? (
          <p className="text-sm text-red-600">
            Select All shops or at least one shop.
          </p>
        ) : null}

        {state.message && !state.ok ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {state.message}
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
