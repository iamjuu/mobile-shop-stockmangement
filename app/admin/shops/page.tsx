import Link from "next/link";

import { getShopsAction } from "@/features/shops/actions/get-shops";
import { ShopTable } from "@/features/shops/components/ShopTable";

export default async function ShopsPage() {
  const shops =
    await getShopsAction();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-zinc-200 bg-white p-5">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            Store locations
          </p>
          <h1 className="mt-1 text-3xl font-semibold">
            Shops
          </h1>
        </div>

        <Link
          href="/admin/shops/create"
          className="inline-flex items-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Add Shop
        </Link>
      </div>

      <ShopTable shops={shops} />
    </div>
  );
}
