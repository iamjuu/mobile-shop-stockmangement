import {
  LayoutDashboard,
  Store,
  Tags,
  Boxes,
  Package,
  Users,
  BarChart3,
  RefreshCcw,
} from "lucide-react";

export const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin/admin-dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Shops",
    href: "/admin/shops",
    icon: Store,
  },
  {
    title: "Categories",
    href: "/admin/categories",
    icon: Tags,
  },
  {
    title: "Brands",
    href: "/admin/subcategories",
    icon: Boxes,
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "Exchange",
    href: "/admin/exchanges",
    icon: RefreshCcw,
  },
  {
    title: "Employees",
    href: "/admin/employees",
    icon: Users,
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
];
