import Link from "next/link";
import { redirect } from "next/navigation";
import { Boxes, ReceiptText, Store } from "lucide-react";

import { createAuthSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

async function signIn(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/sign-in?error=Email%20and%20password%20are%20required");
  }

  let user;

  try {
    user = await prisma.user.findUnique({
      where: { email },
    });
  } catch {
    redirect("/sign-in?error=Database%20connection%20failed");
  }

  if (!user || !verifyPassword(password, user.passwordHash)) {
    redirect("/sign-in?error=Invalid%20email%20or%20password");
  }

  await createAuthSession(user);

  if (user.role === "ADMIN") {
    redirect("/admin/admin-dashboard");
  }

  redirect("/employee/billing");
}

const features = [
  ["Shops", "Branch records", Store],
  ["Products", "Stock and pricing", Boxes],
  ["Billing", "Employee checkout", ReceiptText],
];

export default async function Page({ searchParams }: PageProps) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-[#f4f2eb] p-[10px] text-zinc-950">
      <div className="grid min-h-[calc(100vh-20px)] gap-5 lg:grid-cols-[1fr_480px]">
        <section className="flex flex-col justify-between rounded-[28px] bg-zinc-950 p-8 text-white">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-950">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-300">
                  Stock Management
                </p>
                <h1 className="text-2xl font-semibold">Inventory control</h1>
              </div>
            </Link>

            <div className="mt-20 max-w-3xl">
              <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-zinc-200">
                Secure workspace access
              </p>
              <h2 className="mt-6 text-5xl font-semibold tracking-normal sm:text-6xl">
                Sign in and continue managing shop operations.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300">
                Admins manage inventory and reports. Employees open billing,
                scan products, and record sales.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {features.map(([title, detail, Icon]) => {
              const FeatureIcon = Icon as typeof Store;

              return (
                <div key={String(title)} className="rounded-3xl bg-white/10 p-5">
                  <FeatureIcon className="h-6 w-6 text-[#ffdc5d]" />
                  <p className="mt-5 text-xl font-semibold">{String(title)}</p>
                  <p className="mt-1 text-sm text-zinc-300">{String(detail)}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="flex items-center justify-center rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="text-sm font-medium text-zinc-500">Welcome back</p>
              <h2 className="mt-2 text-4xl font-semibold text-zinc-950">
                Sign in
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                Access your stock management dashboard.
              </p>
            </div>

            {error ? (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form action={signIn} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Sign in
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-600">
              Need an account?{" "}
              <Link href="/sign-up" className="font-semibold text-zinc-950">
                Sign up
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
