"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/require-user";
import type { FormActionState } from "@/lib/forms/action-state";
import { creditScoreSchema } from "./schema";

// Recording a score adds a new time-series row (history is preserved); the
// latest per bureau is shown as "current".
export async function saveCreditScore(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await requireUser();
  const parsed = creditScoreSchema.safeParse({
    bureau: formData.get("bureau"),
    score: formData.get("score"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await prisma.creditScore.create({
    data: {
      userId: user.id,
      bureau: parsed.data.bureau,
      score: parsed.data.score,
      asOf: new Date(),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { status: "success" };
}

export async function deleteCreditScore(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.creditScore.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
