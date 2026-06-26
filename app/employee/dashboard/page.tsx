import Link from "next/link";
import {
  ArrowUpRight,
  type LucideIcon,
  Package,
  ReceiptText,
  RefreshCcw,
  Store,
} from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const currency = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  style: "currency",
});

export default async function EmployeeDashboard() {
  const user = await getCurrentUser();
  const employeeId = user?.id ?? "";

  const [
    todaySales,
    recentExchanges,
    totalProducts,
    totalShops,
  ] = await Promise.all([
    prisma.sale.findMany({
      where: {
        employeeId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
    prisma.exchange.findMany({
      where: {
        employeeId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
    prisma.product.count(),
    prisma.shop.count(),
  ]);

  const soldQuantity = todaySales.reduce(
    (sum, sale) => sum + sale.quantity,
    0
  );
  const totalAmount = todaySales.reduce(
    (sum, sale) => sum + sale.totalAmount,
    0
  );
  const stats: {
    label: string;
    value: number;
    detail: string;
    icon: LucideIcon;
  }[] = [
    {
      label: "Products",
      value: totalProducts,
      detail: "Items available",
      icon: Package,
    },
    {
      label: "Shops",
      value: totalShops,
      detail: "Store locations",
      icon: Store,
    },
    {
      label: "Exchanges",
      value: recentExchanges.length,
      detail: "Recent exchange records",
      icon: RefreshCcw,
    },
    {
      label: "Sold Items",
      value: soldQuantity,
      detail: "Recent employee sales",
      icon: ReceiptText,
    },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] bg-zinc-950 p-7 text-white">
        <p className="text-sm font-medium text-zinc-300">
          Welcome back
        </p>
        <h1 className="mt-3 text-4xl font-semibold">
          Sell products with QR billing.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300">
          Open billing, choose a shop, scan a product QR from the header, and
          confirm the sale to reduce stock automatically.
        </p>

        <Link
          href="/employee/billing"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-950"
        >
          Start Billing
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => {
          const StatIcon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-[24px] border border-zinc-200 bg-white p-6"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-500">
                  {stat.label}
                </p>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
                  <StatIcon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-5 text-2xl font-semibold">{stat.value}</p>
              <p className="mt-2 text-sm text-zinc-500">{stat.detail}</p>
            </div>
          );
        })}
      </section>

      <section className="rounded-[24px] border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Recent sales</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Total recent amount: {currency.format(totalAmount)}
            </p>
          </div>
          <Link
            href="/employee/sales-history"
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-50"
          >
            View History
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {todaySales.length > 0 ? (
            todaySales.map((sale) => (
              <div
                key={sale.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-zinc-50 px-4 py-4"
              >
                <div>
                  <p className="font-medium">{sale.productName}</p>
                  <p className="text-sm text-zinc-500">
                    {sale.productCode} - {sale.quantity} units
                  </p>
                </div>
                <p className="font-semibold">
                  {currency.format(sale.totalAmount)}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
              No sales recorded yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
