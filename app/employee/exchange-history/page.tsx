import { RefreshCcw } from "lucide-react";

import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const currency = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  style: "currency",
});

export default async function ExchangeHistoryPage() {
  const employeeId = await getCurrentUserId();
  const exchanges = await prisma.exchange.findMany({
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
            <RefreshCcw className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Employee exchanges
            </p>
            <h1 className="text-3xl font-semibold">Exchange History</h1>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-semibold">Completed exchanges</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {exchanges.length} exchanges recorded
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-4">Sold Product</th>
                <th className="px-5 py-4">Received Phone</th>
                <th className="px-5 py-4">Shop</th>
                <th className="px-5 py-4">Product Price</th>
                <th className="px-5 py-4">Exchange Value</th>
                <th className="px-5 py-4">Cash Balance</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 text-sm">
              {exchanges.length > 0 ? (
                exchanges.map((exchange) => (
                  <tr
                    key={exchange.id}
                    className="transition hover:bg-zinc-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-zinc-950">
                        {exchange.soldProductName}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {exchange.soldProductCode}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-zinc-950">
                        {exchange.receivedProductName}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {exchange.receivedProductCode}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-zinc-700">
                      {exchange.shop.shopName}
                    </td>
                    <td className="px-5 py-4 font-medium">
                      {currency.format(exchange.soldProductPrice)}
                    </td>
                    <td className="px-5 py-4 text-zinc-700">
                      {currency.format(exchange.exchangeValue)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-emerald-700">
                      {currency.format(exchange.cashBalance)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                        {exchange.paymentMethod ?? "CASH"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-zinc-600">
                      {exchange.createdAt.toLocaleString("en-IN", {
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
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm text-zinc-500"
                  >
                    No exchanges found. Complete an exchange to see it here.
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
