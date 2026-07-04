import { IndianRupee, ReceiptText, TrendingUp } from "lucide-react";

import { prisma } from "@/lib/prisma";

const currency = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 0,
  style: "currency",
});

const formatter = new Intl.NumberFormat("en-IN");

export default async function ProfitPage() {
  const [profitResult, saleCount, latestSales] = await Promise.all([
    prisma.sale.aggregate({
      _sum: {
        profit: true,
        totalAmount: true,
      },
    }),
    prisma.sale.count(),
    prisma.sale.findMany({
      include: {
        employee: true,
        shop: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
    }),
  ]);

  const totalProfit = profitResult._sum.profit ?? 0;
  const totalRevenue = profitResult._sum.totalAmount ?? 0;

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-zinc-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-950 text-white">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">
                Sales performance
              </p>
              <h1 className="text-3xl font-semibold">Profit</h1>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[20px] bg-zinc-50 p-5">
            <p className="text-sm font-medium text-zinc-500">Total profit</p>
            <p className="mt-3 text-3xl font-semibold">
              {currency.format(totalProfit)}
            </p>
          </div>
          <div className="rounded-[20px] bg-zinc-50 p-5">
            <p className="text-sm font-medium text-zinc-500">Revenue</p>
            <p className="mt-3 text-3xl font-semibold">
              {currency.format(totalRevenue)}
            </p>
          </div>
          <div className="rounded-[20px] bg-zinc-50 p-5">
            <p className="text-sm font-medium text-zinc-500">Sales</p>
            <p className="mt-3 text-3xl font-semibold">
              {formatter.format(saleCount)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Recent profit entries</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Latest billed products with sale profit.
            </p>
          </div>
          <TrendingUp className="h-7 w-7 text-zinc-700" />
        </div>

        <div className="mt-6 overflow-hidden rounded-[20px] border border-zinc-200">
          {latestSales.length > 0 ? (
            <div className="divide-y divide-zinc-200">
              {latestSales.map((sale) => (
                <div
                  key={sale.id}
                  className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[1.4fr_1fr_1fr_auto]"
                >
                  <div>
                    <p className="font-medium text-zinc-950">
                      {sale.productName}
                    </p>
                    <p className="mt-1 text-zinc-500">{sale.productCode}</p>
                  </div>
                  <p className="text-zinc-600">{sale.shop.shopName}</p>
                  <p className="text-zinc-600">{sale.employee.name}</p>
                  <p className="font-semibold text-zinc-950">
                    {currency.format(sale.profit)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center px-4 py-10 text-center">
              <ReceiptText className="h-8 w-8 text-zinc-400" />
              <p className="mt-3 text-sm font-medium text-zinc-950">
                No sales recorded yet.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
