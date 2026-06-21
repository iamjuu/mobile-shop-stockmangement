import { z } from "zod";

export const productSchema =
  z.object({
    productName: z.string().min(2),

    shopId: z.string(),

    categoryId: z.string(),

    subcategoryId: z.string(),

    purchasePrice:
      z.coerce.number().min(0),

    price: z.coerce.number().min(0),

    stock: z.coerce.number().int().min(0),

    description:
      z.string().optional(),

    imageUrl:
      z.string().optional(),
  });

export type ProductFormValues =
  z.infer<typeof productSchema>;
