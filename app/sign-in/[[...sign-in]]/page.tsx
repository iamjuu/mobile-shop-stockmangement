import Link from "next/link";
import { redirect } from "next/navigation";

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

export default async function Page({ searchParams }: PageProps) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-950">Sign in</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Access your stock management dashboard.
          </p>
        </div>

        {error ? (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
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
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          Need an account?{" "}
          <Link href="/sign-up" className="font-medium text-zinc-950">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
