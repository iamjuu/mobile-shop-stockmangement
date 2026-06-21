import Link from "next/link";
import { BarChart3, ReceiptText, ShieldCheck, Store } from "lucide-react";

const entryCards = [
  {
    title: "Admin",
    description: "Manage shops, products, categories, inventory, employees, and reports.",
    href: "/admin/admin-dashboard",
    icon: ShieldCheck,
    accent: "bg-zinc-950 text-white",
  },
  {
    title: "Employee",
    description: "Open billing, scan products, and review daily sales activity.",
    href: "/employee/billing",
    icon: ReceiptText,
    accent: "bg-emerald-600 text-white",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-10 sm:px-8">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-950 text-white">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Stock Management</p>
            <h1 className="text-2xl font-semibold tracking-normal text-zinc-950">
              Choose your workspace
            </h1>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-stretch">
          <div className="flex min-h-[360px] flex-col justify-between rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700">
                <BarChart3 className="h-4 w-4" />
                Inventory and billing system
              </div>

              <h2 className="max-w-2xl text-4xl font-semibold tracking-normal text-zinc-950 sm:text-5xl">
                Manage stock, shops, and sales from one clean dashboard.
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600">
                Select the workspace that matches your role. Admins handle setup
                and reporting, while employees work directly with billing and
                sales operations.
              </p>
            </div>

            <div className="mt-10 grid gap-4 border-t border-zinc-200 pt-6 sm:grid-cols-3">
              <div>
                <p className="text-2xl font-semibold">Shops</p>
                <p className="mt-1 text-sm text-zinc-500">Branch records</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">Products</p>
                <p className="mt-1 text-sm text-zinc-500">Stock and pricing</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">Billing</p>
                <p className="mt-1 text-sm text-zinc-500">Employee checkout</p>
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
                  className="group flex min-h-[180px] flex-col justify-between rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-semibold text-zinc-950">
                        {card.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-zinc-600">
                        {card.description}
                      </p>
                    </div>

                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${card.accent}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="mt-6 text-sm font-medium text-zinc-950">
                    Continue as {card.title}
                    <span className="ml-2 transition group-hover:ml-3">-&gt;</span>
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
