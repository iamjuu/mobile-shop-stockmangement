import { redirect } from "next/navigation";

import { EmployeeLayout } from "@/components/employee/employee-layout";
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

  return (
    <EmployeeLayout userName={user.name}>
      {children}
    </EmployeeLayout>
  );
}
