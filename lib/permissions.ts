export enum Role {
  ADMIN = "ADMIN",
  EMPLOYEE = "EMPLOYEE",
}

export const ADMIN_ROUTES = [
  "/dashboard",
  "/shops",
  "/products",
  "/categories",
  "/employees",
];

export const EMPLOYEE_ROUTES = [
  "/billing",
  "/sales-history",
];