import { redirect } from "next/navigation";

import { clearAuthSession } from "@/lib/auth";
import { MobileScannerButton } from "./mobile-scanner-button";

export function EmployeeHeader({
  userName,
}: {
  userName: string;
}) {
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
            Employee Workspace
          </p>
          <h1 className="text-xl font-semibold">
            {userName}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <MobileScannerButton />

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
    </div>
  );
}
