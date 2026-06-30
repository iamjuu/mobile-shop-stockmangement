import { Users } from "lucide-react";

import { CustomerDirectory } from "@/features/customers/components/CustomerDirectory";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-zinc-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-950 text-white">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Customer records
            </p>
            <h1 className="text-3xl font-semibold">Users</h1>
          </div>
        </div>
      </section>

      <CustomerDirectory
        showEmployee
        customers={customers.map((customer) => ({
          id: customer.id,
          customerName: customer.customerName,
          phone: customer.phone,
          type: customer.type,
          employeeName: customer.employeeName,
          shopName: customer.shopName,
          receivedProductName: customer.receivedProductName,
          receivedProductCode: customer.receivedProductCode,
          amount: customer.amount,
          resalePrice: customer.resalePrice,
          imeiNumber: customer.imeiNumber,
          createdAt: customer.createdAt.toLocaleString("en-IN", {
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
