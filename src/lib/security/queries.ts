import { prisma } from "@/lib/db/prisma";

/**
 * Returns true if the user has set up their app passphrase.
 * Used to determine whether the Settings page shows "Set" vs "Change" UI
 * and whether requireUnlocked() should enforce the passphrase gate.
 */
export async function hasPassphrase(userId: string): Promise<boolean> {
  const row = await prisma.userSecurity.findUnique({
    where: { userId },
    select: { id: true },
  });
  return row !== null;
}
