"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/require-user";
import type { FormActionState } from "@/lib/forms/action-state";
import { creditCardSchema } from "./schema";
import { computeNextDueDate } from "./queries";

function revalidateCards() {
  revalidatePath("/cards");
  revalidatePath("/dashboard");
}

export async function saveCreditCard(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const parsed = creditCardSchema.safeParse({
    issuer: formData.get("issuer"),
    network: formData.get("network"),
    nickname: formData.get("nickname") || undefined,
    last4: formData.get("last4") ?? "",
    creditLimit: formData.get("creditLimit"),
    currentOutstanding: formData.get("currentOutstanding"),
    statementDay: formData.get("statementDay") ?? "",
    dueDay: formData.get("dueDay") ?? "",
    currentDueDate: formData.get("currentDueDate") ?? "",
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const d = parsed.data;
  const currentDueDate = d.currentDueDate
    ? new Date(d.currentDueDate)
    : computeNextDueDate(d.dueDay ?? null);

  const data = {
    issuer: d.issuer,
    network: d.network,
    nickname: d.nickname || null,
    last4: d.last4 ? d.last4 : null,
    creditLimit: new Prisma.Decimal(String(d.creditLimit)),
    currentOutstanding: new Prisma.Decimal(String(d.currentOutstanding)),
    statementDay: d.statementDay ?? null,
    dueDay: d.dueDay ?? null,
    currentDueDate,
    notes: d.notes || null,
  };

  if (id) {
    const owned = await prisma.creditCard.findFirst({
      where: { id, userId: user.id },
    });
    if (!owned) return { status: "error", message: "Card not found." };
    await prisma.creditCard.update({ where: { id }, data });
  } else {
    await prisma.creditCard.create({ data: { ...data, userId: user.id } });
  }

  revalidateCards();
  return { status: "success" };
}

export async function deleteCreditCard(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.creditCard.deleteMany({ where: { id, userId: user.id } });
  revalidateCards();
}
