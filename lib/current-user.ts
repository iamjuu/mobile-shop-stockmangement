import { prisma } from "./prisma";
import { getSessionPayload } from "./auth";

export async function getCurrentUser() {
  const session = await getSessionPayload();

  if (!session?.sub) {
    return null;
  }

  try {
    return await prisma.user.findUnique({
      where: {
        id: session.sub,
      },
    });
  } catch {
    return null;
  }
}
