import { createShopAction } from "@/features/shops/actions/create-shop";
import {
  ShopForm,
  type ShopFormValues,
} from "@/features/shops/components/ShopForm";

export default function CreateShopPage() {
  async function submit(
    data: ShopFormValues
  ) {
    "use server";

    return createShopAction(data);
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
