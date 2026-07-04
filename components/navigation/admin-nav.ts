import {
  LayoutDashboard,
  Store,
  Tags,
  Boxes,
  Package,
  PlusCircle,
  Users,
  BarChart3,
  RefreshCcw,
  IndianRupee,
  type LucideIcon,
} from "lucide-react";

type AdminNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const adminNavItems: AdminNavItem[] = [
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
    title: "Add Product",
    href: "/admin/products",
    icon: PlusCircle,
  },
  {
    title: "Product",
    href: "/admin/product-catalog",
    icon: Package,
  },
  {
    title: "Exchange",
    href: "/admin/exchanges",
    icon: RefreshCcw,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Employees",
    href: "/admin/employees",
    icon: Users,
  },
  {
    title: "Profit",
    href: "/admin/profit",
    icon: IndianRupee,
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
];
