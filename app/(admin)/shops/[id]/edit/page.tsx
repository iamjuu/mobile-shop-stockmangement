import { redirect } from "next/navigation";

import {
  getShopByIdAction,
} from "@/features/shops/actions/get-shop-by-id";

import {
  updateShopAction,
} from "@/features/shops/actions/update-shop";

import { ShopForm } from "@/features/shops/components/ShopForm";

export default async function EditPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const shop =
    await getShopByIdAction(id);

  async function submit(
    data: any
  ) {
    "use server";

    await updateShopAction({
      id,
      ...data,
    });

    redirect("/shops");
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Edit Shop
      </h1>

      <ShopForm
        defaultValues={{
          shopName:
            shop.shopName,
          shopCode:
            shop.shopCode,
          address:
            shop.address || "",
          phone:
            shop.phone || "",
          description:
            shop.description || "",
        }}
        onSubmit={submit}
      />
    </div>
  );
}