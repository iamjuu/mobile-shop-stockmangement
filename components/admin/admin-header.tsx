import { redirect } from "next/navigation";

import { clearAuthSession } from "@/lib/auth";

export function AdminHeader() {
  async function logout() {
    "use server";

    await clearAuthSession();
    redirect("/sign-in");
  }

  return (
    <div className="border-b border-zinc-200 bg-white/60 p-[10px]">
      <div className="flex w-full items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            Admin Workspace
          </p>
          <h1 className="text-xl font-semibold">
            Inventory control center
          </h1>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}
