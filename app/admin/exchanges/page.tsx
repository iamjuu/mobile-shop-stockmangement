import { RefreshCcw } from "lucide-react";

import { AdminExchangeList } from "@/features/products/components/AdminExchangeList";
import { prisma } from "@/lib/prisma";

export default async function AdminExchangesPage() {
  const exchanges = await prisma.exchange.findMany({
    include: {
      employee: true,
      shop: true,
      soldProduct: {
        include: {
          category: true,
          subcategory: true,
        },
      },
      receivedProduct: {
        include: {
          category: true,
          subcategory: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-zinc-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-950 text-white">
            <RefreshCcw className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Admin exchange records
            </p>
            <h1 className="text-3xl font-semibold">Exchange Products</h1>
          </div>
        </div>
      </section>

      <AdminExchangeList
        exchanges={exchanges.map((exchange) => ({
          id: exchange.id,
          receivedProductName: exchange.receivedProductName,
          receivedProductCode: exchange.receivedProductCode,
          receivedProductImageUrl:
            exchange.receivedProduct.mainImageUrl ??
            exchange.receivedProduct.imageUrl,
          receivedCategoryName: exchange.receivedProduct.category.name,
          receivedSubcategoryName: exchange.receivedProduct.subcategory.name,
          receivedProductPrice: exchange.receivedProductPrice,
          receivedProductStock: exchange.receivedProduct.stock,
          soldProductName: exchange.soldProductName,
          soldProductCode: exchange.soldProductCode,
          soldCategoryName: exchange.soldProduct.category.name,
          soldSubcategoryName: exchange.soldProduct.subcategory.name,
          soldProductPrice: exchange.soldProductPrice,
          exchangeValue: exchange.exchangeValue,
          cashBalance: exchange.cashBalance,
          paymentMethod: exchange.paymentMethod ?? "CASH",
          employeeName: exchange.employee.name,
          employeeEmail: exchange.employee.email,
          shopName: exchange.shop.shopName,
          shopCode: exchange.shop.shopCode,
          shopPhone: exchange.shop.phone || "Not added",
          shopAddress: exchange.shop.address || "Not added",
          condition: exchange.condition || "Not added",
          notes: exchange.notes || "Not added",
          createdAt: exchange.createdAt.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        }))}
      />
    </div>
  );
}
