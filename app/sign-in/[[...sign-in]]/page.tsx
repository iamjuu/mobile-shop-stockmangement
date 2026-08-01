import Link from "next/link";
import { redirect } from "next/navigation";
import { Boxes, ReceiptText, Store } from "lucide-react";

import { PendingSubmitButton } from "@/components/pending-submit-button";
import { createAuthSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams: Promise<{
    error?: string;
    role?: string;
  }>;
};

async function signIn(formData: FormData) {
  "use server";

  const requestedRole = String(formData.get("role") ?? "admin");
  const shopId = String(formData.get("shopId") ?? "");
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

  if (requestedRole === "admin" && user.role !== "ADMIN") {
    redirect("/sign-in?role=admin&error=Use%20employee%20login%20for%20this%20account");
  }

  if (requestedRole === "employee" && user.role !== "EMPLOYEE") {
    redirect("/sign-in?role=employee&error=Use%20admin%20login%20for%20this%20account");
  }

  if (user.role === "EMPLOYEE") {
    if (!shopId) {
      redirect("/sign-in?role=employee&error=Choose%20your%20shop%20before%20signing%20in");
    }

    if (!user.shopId || user.shopId !== shopId) {
      redirect("/sign-in?role=employee&error=Invalid%20shop%20for%20this%20employee");
    }
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
  const { error, role } = await searchParams;
  const activeRole = role === "employee" ? "employee" : "admin";
  const isEmployeeLogin = activeRole === "employee";
  const shops = isEmployeeLogin
    ? await prisma.shop.findMany({
        orderBy: {
          shopName: "asc",
        },
      })
    : [];

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
              <h2 className="mt-6 text-3xl font-semibold tracking-normal sm:text-4xl">
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
                {isEmployeeLogin ? "Employee sign in" : "Admin sign in"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                {isEmployeeLogin
                  ? "Choose your shop and continue to billing."
                  : "Continue to the admin dashboard without choosing a shop."}
              </p>
            </div>

            {error ? (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mb-6 grid grid-cols-2 gap-2 rounded-full bg-zinc-100 p-1">
              <Link
                href="/sign-in?role=admin"
                className={`rounded-full px-4 py-2 text-center text-sm font-semibold transition ${
                  !isEmployeeLogin
                    ? "bg-zinc-950 text-white"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                Admin
              </Link>
              <Link
                href="/sign-in?role=employee"
                className={`rounded-full px-4 py-2 text-center text-sm font-semibold transition ${
                  isEmployeeLogin
                    ? "bg-zinc-950 text-white"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                Employee
              </Link>
            </div>

            <form action={signIn} className="space-y-5">
              <input type="hidden" name="role" value={activeRole} />

              {isEmployeeLogin ? (
                <div>
                  <label
                    htmlFor="shopId"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Shop
                  </label>
                  <select
                    id="shopId"
                    name="shopId"
                    required
                    defaultValue=""
                    className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                  >
                    <option value="">Choose employee shop</option>
                    {shops.map((shop) => (
                      <option key={shop.id} value={shop.id}>
                        {shop.shopName}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                  Admin login does not need shop selection.
                </div>
              )}

              {isEmployeeLogin && shops.length === 0 ? (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  No shops found. Create a shop before employee login.
                </div>
              ) : null}

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

              <PendingSubmitButton
                disabled={isEmployeeLogin && shops.length === 0}
                pendingLabel="Signing in..."
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              >
                Sign in
              </PendingSubmitButton>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-600">
              Admin setup?{" "}
              <Link href="/sign-up" className="font-semibold text-zinc-950">
                Create admin account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
