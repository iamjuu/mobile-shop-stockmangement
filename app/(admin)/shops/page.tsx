import Link from "next/link";

import { getShopsAction } from "@/features/shops/actions/get-shops";
import { ShopTable } from "@/features/shops/components/ShopTable";

export default async function ShopsPage() {
  const shops =
    await getShopsAction();

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">
          Shops
        </h1>

        <Link
          href="/shops/create"
          className="bg-black text-white px-4 py-2 rounded"
        >
          Add Shop
        </Link>
      </div>

      <ShopTable shops={shops} />
    </div>
  );
}