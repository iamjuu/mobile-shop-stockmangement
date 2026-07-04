import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Boxes,
  ReceiptText,
  ShieldCheck,
  Store,
} from "lucide-react";

const entryCards = [
  {
    title: "Admin",
    description: "Manage shops, products, categories, inventory, employees, and reports.",
    href: "/admin/admin-dashboard",
    icon: ShieldCheck,
    accent: "bg-zinc-950 text-white",
    className: "bg-white",
  },
  {
    title: "Employee",
    description: "Open billing, scan products, and review daily sales activity.",
    href: "/employee/billing",
    icon: ReceiptText,
    accent: "bg-[#ffdc5d] text-zinc-950",
    className: "bg-[#fff4bf]",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4f2eb] text-zinc-950">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-[10px] py-6">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Stock Management
            </p>
            <h1 className="text-3xl font-semibold tracking-normal text-zinc-950">
              Choose your workspace
            </h1>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_420px] lg:items-stretch">
          <div className="flex min-h-[520px] flex-col justify-between rounded-[28px] bg-zinc-950 p-8 text-white shadow-sm">
            <div>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-zinc-200">
                <BarChart3 className="h-4 w-4" />
                Inventory and billing system
              </div>

              <h2 className="max-w-4xl text-3xl font-semibold tracking-normal sm:text-4xl">
                Manage stock, shops, and sales from one clean dashboard.
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300">
                Select the workspace that matches your role. Admins handle setup
                and reporting, while employees work directly with billing and
                sales operations.
              </p>
            </div>

            <div className="mt-12 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
              <div className="rounded-3xl bg-white/10 p-5">
                <Store className="h-6 w-6 text-[#ffdc5d]" />
                <p className="mt-5 text-2xl font-semibold">Shops</p>
                <p className="mt-1 text-sm text-zinc-300">Branch records</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5">
                <Boxes className="h-6 w-6 text-[#ffdc5d]" />
                <p className="mt-5 text-2xl font-semibold">Products</p>
                <p className="mt-1 text-sm text-zinc-300">Stock and pricing</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5">
                <ReceiptText className="h-6 w-6 text-[#ffdc5d]" />
                <p className="mt-5 text-2xl font-semibold">Billing</p>
                <p className="mt-1 text-sm text-zinc-300">Employee checkout</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {entryCards.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className={`group flex min-h-[250px] flex-col justify-between rounded-[28px] border border-zinc-200 p-7 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md ${card.className}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-3xl font-semibold text-zinc-950">
                        {card.title}
                      </h3>
                      <p className="mt-5 max-w-sm text-sm leading-6 text-zinc-600">
                        {card.description}
                      </p>
                    </div>

                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${card.accent}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition group-hover:bg-zinc-800">
                    Continue as {card.title}
                    <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
