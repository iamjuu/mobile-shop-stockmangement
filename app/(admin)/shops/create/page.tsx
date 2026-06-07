import { redirect } from "next/navigation";

import { createShopAction } from "@/features/shops/actions/create-shop";
import { ShopForm } from "@/features/shops/components/ShopForm";

export default function CreateShopPage() {
  async function submit(
    data: any
  ) {
    "use server";

    await createShopAction(data);

    redirect("/shops");
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Create Shop
      </h1>

      <ShopForm
        onSubmit={submit}
      />
    </div>
  );
}