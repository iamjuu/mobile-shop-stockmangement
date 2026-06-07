import {
  LayoutDashboard,
  Receipt,
  History,
} from "lucide-react";

export const employeeNavItems = [
  {
    title: "Dashboard",
    href: "/employee/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Billing",
    href: "/employee/billing",
    icon: Receipt,
  },
  {
    title: "Sales History",
    href: "/employee/sales-history",
    icon: History,
  },
];