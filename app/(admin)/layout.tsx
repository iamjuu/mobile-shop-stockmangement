import { redirect } from "next/navigation";

import { AdminLayout } from "@/components/admin/admin-layout";
import { getCurrentUser } from "@/lib/current-user";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (user.role !== "ADMIN") {
    redirect("/billing");
  }

  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
}