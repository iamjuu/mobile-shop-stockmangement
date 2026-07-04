import { revalidatePath } from "next/cache";
import { IndianRupee, ReceiptText, Wrench } from "lucide-react";

import { PendingSubmitButton } from "@/components/pending-submit-button";
import { prisma } from "@/lib/prisma";
import { ServicePriceInput } from "./service-price-input";

const currency = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 0,
  style: "currency",
});

export default async function ServicesPage() {
  const services = await prisma.serviceComplaint.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  async function createServiceComplaint(formData: FormData) {
    "use server";

    const customerName = String(formData.get("customerName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const deviceName = String(formData.get("deviceName") ?? "").trim();
    const complaint = String(formData.get("complaint") ?? "").trim();
    const servicePrice = Number(formData.get("servicePrice") ?? 0);
    const notes = String(formData.get("notes") ?? "").trim();

    if (
      !customerName ||
      !complaint ||
      !Number.isFinite(servicePrice) ||
      servicePrice < 0
    ) {
      return;
    }

    await prisma.serviceComplaint.create({
      data: {
        customerName,
        phone: phone || null,
        deviceName: deviceName || null,
        complaint,
        servicePrice,
        notes: notes || null,
      },
    });

    revalidatePath("/employee/services");
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <section className="rounded-[24px] border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-950 text-white">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">
                Repair counter
              </p>
              <h1 className="text-3xl font-semibold">Services</h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-zinc-500">
            Record customer service complaints such as display replacement,
            speaker repair, battery change, charging issue, or any other
            custom service with its price.
          </p>

          <form action={createServiceComplaint} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="customerName"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Customer name
              </label>
              <input
                id="customerName"
                name="customerName"
                type="text"
                required
                placeholder="Example: Rahul Kumar"
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Customer phone number"
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
              />
            </div>

            <div>
              <label
                htmlFor="deviceName"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Device
              </label>
              <input
                id="deviceName"
                name="deviceName"
                type="text"
                placeholder="Example: iPhone 13, Redmi Note 10"
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
              />
            </div>

            <div>
              <label
                htmlFor="complaint"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Complaint
              </label>
              <input
                id="complaint"
                name="complaint"
                type="text"
                required
                placeholder="Example: Display replace, speaker change"
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
              />
            </div>

            <div>
              <label
                htmlFor="servicePrice"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Service price
              </label>
              <ServicePriceInput
                id="servicePrice"
                min="0"
                step="1"
                required
                placeholder="Example: 2500"
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
              />
            </div>

            <div>
              <label
                htmlFor="notes"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Optional service details"
                className="w-full resize-none rounded-3xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
              />
            </div>

            <PendingSubmitButton
              pendingLabel="Saving service..."
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              Save Service
            </PendingSubmitButton>
          </form>
        </section>

        <section className="rounded-[24px] border border-zinc-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-500">
                Complaint history
              </p>
              <h2 className="text-3xl font-semibold">Recent services</h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100">
              <ReceiptText className="h-5 w-5 text-zinc-700" />
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[20px] border border-zinc-200">
            {services.length > 0 ? (
              <div className="divide-y divide-zinc-200">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="grid gap-3 px-4 py-4 text-sm xl:grid-cols-[1.1fr_1.3fr_auto]"
                  >
                    <div>
                      <p className="font-medium text-zinc-950">
                        {service.customerName}
                      </p>
                      <p className="mt-1 text-zinc-500">
                        {service.phone || "Phone not added"}
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-zinc-950">
                        {service.complaint}
                      </p>
                      <p className="mt-1 text-zinc-500">
                        {service.deviceName || "Device not added"}
                      </p>
                      {service.notes ? (
                        <p className="mt-2 text-xs leading-5 text-zinc-500">
                          {service.notes}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 font-semibold text-zinc-950 xl:justify-end">
                      <IndianRupee className="h-4 w-4" />
                      {currency.format(service.servicePrice)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-medium text-zinc-950">
                  No service complaints yet.
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  Saved services will appear here.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
