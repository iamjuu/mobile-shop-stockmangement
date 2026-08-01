"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { PendingSubmitButton } from "@/components/pending-submit-button";

interface ShopOption {
  id: string;
  shopName: string;
}

export interface EmployeeCreateState {
  ok: boolean;
  message: string;
}

interface EmployeeCreateFormProps {
  shops: ShopOption[];
  action: (
    state: EmployeeCreateState,
    formData: FormData
  ) => Promise<EmployeeCreateState>;
}

const initialState: EmployeeCreateState = {
  ok: false,
  message: "",
};

export function EmployeeCreateForm({
  shops,
  action,
}: EmployeeCreateFormProps) {
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
      <form ref={formRef} action={formAction} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="shopId"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            Shop
          </label>
          <select
            id="shopId"
            name="shopId"
            required
            disabled={shops.length === 0}
            defaultValue=""
            className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-100"
          >
            <option value="">Choose shop</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.shopName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            Employee name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Example: Rahul Kumar"
            className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="employee@example.com"
            className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            Temporary password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={8}
            required
            placeholder="Minimum 8 characters"
            className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
          />
        </div>

        <PendingSubmitButton
          disabled={shops.length === 0}
          pendingLabel="Creating employee..."
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Create Employee
        </PendingSubmitButton>

        {state.message && !state.ok ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {state.message}
          </p>
        ) : null}

        {shops.length === 0 ? (
          <p className="text-sm text-red-600">
            Create a shop before adding employees.
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
