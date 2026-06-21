import { History } from "lucide-react";

import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const currency = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  style: "currency",
});

export default async function SalesHistoryPage() {
  const employeeId = await getCurrentUserId();
  const sales = await prisma.sale.findMany({
    where: {
      employeeId,
    },
    include: {
      shop: true,
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
            <History className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Employee sales
            </p>
            <h1 className="text-3xl font-semibold">
              Sales History
            </h1>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-semibold">Sold products</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {sales.length} sales recorded
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Shop</th>
                <th className="px-5 py-4">Quantity</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 text-sm">
              {sales.length > 0 ? (
                sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="transition hover:bg-zinc-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-zinc-950">
                        {sale.productName}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {sale.productCode}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-zinc-700">
                      {sale.shop.shopName}
                    </td>
                    <td className="px-5 py-4">
                      {sale.quantity}
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      {currency.format(sale.totalAmount)}
                    </td>
                    <td className="px-5 py-4 text-zinc-600">
                      {sale.createdAt.toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-sm text-zinc-500"
                  >
                    No sales found. Scan a product QR in Billing to record a sale.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
