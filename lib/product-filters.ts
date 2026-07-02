import type { Prisma } from "@prisma/client";

export const activeProductWhere = {
  OR: [
    {
      deletedAt: null,
    },
    {
      deletedAt: {
        isSet: false,
      },
    },
  ],
} satisfies Prisma.ProductWhereInput;
