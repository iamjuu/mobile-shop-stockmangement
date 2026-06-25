import Link from "next/link";
import { redirect } from "next/navigation";
import { Boxes, ReceiptText, ShieldCheck, Store } from "lucide-react";

import { PendingSubmitButton } from "@/components/pending-submit-button";
import { createAuthSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

async function signUp(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "ADMIN" ? "ADMIN" : "EMPLOYEE";

  if (!name || !email || !password) {
    redirect("/sign-up?error=All%20fields%20are%20required");
  }

  if (password.length < 8) {
    redirect("/sign-up?error=Password%20must%20be%20at%20least%208%20characters");
  }

  let existingUser;

  try {
    existingUser = await prisma.user.findUnique({
      where: { email },
    });
  } catch {
    redirect("/sign-up?error=Database%20connection%20failed");
  }

  if (existingUser) {
    redirect("/sign-up?error=An%20account%20with%20that%20email%20already%20exists");
  }

  let user;

  try {
    user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        role,
      },
    });
  } catch {
    redirect("/sign-up?error=Unable%20to%20create%20account");
  }

  await createAuthSession(user);

  if (user.role === "ADMIN") {
    redirect("/admin/admin-dashboard");
  }

  redirect("/employee/billing");
}

const features = [
  ["Setup", "Create shops and products", Store],
  ["Stock", "Track available quantity", Boxes],
  ["Billing", "Sell with QR workflow", ReceiptText],
];

export default async function Page({ searchParams }: PageProps) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-[#f4f2eb] p-[10px] text-zinc-950">
      <div className="grid min-h-[calc(100vh-20px)] gap-5 lg:grid-cols-[1fr_520px]">
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
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-zinc-200">
                <ShieldCheck className="h-4 w-4 text-[#ffdc5d]" />
                Create a secure workspace
              </p>
              <h2 className="mt-6 text-5xl font-semibold tracking-normal sm:text-6xl">
                Start managing inventory, shops, and daily sales.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300">
                Create an admin account for setup or an employee account for
                billing workflows.
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
              <p className="text-sm font-medium text-zinc-500">
                Create account
              </p>
              <h2 className="mt-2 text-4xl font-semibold text-zinc-950">
                Sign up
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                Set up access for admin or employee workflows.
              </p>
            </div>

            {error ? (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form action={signUp} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                />
              </div>

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
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  defaultValue="EMPLOYEE"
                  className="w-full rounded-full border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <PendingSubmitButton
                pendingLabel="Creating account..."
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              >
                Create Account
              </PendingSubmitButton>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-600">
              Already have an account?{" "}
              <Link href="/sign-in" className="font-semibold text-zinc-950">
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
