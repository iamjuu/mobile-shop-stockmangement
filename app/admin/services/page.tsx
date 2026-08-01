import { IndianRupee, ReceiptText, Wrench } from "lucide-react";

import { prisma } from "@/lib/prisma";

const currency = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 0,
  style: "currency",
});

const formatter = new Intl.NumberFormat("en-IN");

export default async function AdminServicesPage() {
  const services = await prisma.serviceComplaint.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalServiceIncome = services.reduce(
    (sum, service) => sum + service.servicePrice,
    0
  );
  const averageServicePrice =
    services.length > 0 ? totalServiceIncome / services.length : 0;

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-950 text-white">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">
                Admin service records
              </p>
              <h1 className="text-3xl font-semibold">Services</h1>
            </div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100">
            <ReceiptText className="h-5 w-5 text-zinc-700" />
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <StatCard label="Services" value={formatter.format(services.length)} />
        <StatCard
          label="Service income"
          tone="good"
          value={currency.format(totalServiceIncome)}
        />
        <StatCard
          label="Average price"
          value={currency.format(averageServicePrice)}
        />
      </section>

      <section className="rounded-[24px] border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 p-5">
          <h2 className="text-xl font-semibold text-zinc-950">
            Service details
          </h2>
          <p className="text-sm text-zinc-500">
            Display changes, speaker repairs, and other custom service entries.
          </p>
        </div>

        <div className="overflow-x-auto">
          {services.length > 0 ? (
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
                <tr>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Device</th>
                  <th className="px-5 py-3">Complaint</th>
                  <th className="px-5 py-3">Notes</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {services.map((service) => (
                  <tr key={service.id}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-zinc-950">
                        {service.customerName}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {service.phone || "Phone not added"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-zinc-600">
                      {service.deviceName || "Device not added"}
                    </td>
                    <td className="px-5 py-4 font-medium text-zinc-950">
                      {service.complaint}
                    </td>
                    <td className="max-w-[280px] px-5 py-4 text-zinc-600">
                      <span className="line-clamp-2">
                        {service.notes || "Not added"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-zinc-600">
                      {service.createdAt.toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-emerald-700">
                      {currency.format(service.servicePrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-medium text-zinc-950">
                No service records found.
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Employee service form entries will appear here.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "default" | "good";
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-zinc-200 bg-white p-5">
      <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
      <p
        className={`mt-2 flex items-center gap-1 text-2xl font-semibold ${
          tone === "good" ? "text-emerald-700" : "text-zinc-950"
        }`}
      >
        {tone === "good" ? <IndianRupee className="h-5 w-5" /> : null}
        {value}
      </p>
    </div>
  );
}
