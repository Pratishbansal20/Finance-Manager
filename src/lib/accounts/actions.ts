"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/require-user";
import type { FormActionState } from "@/lib/forms/action-state";
import { bankAccountSchema, manualAssetSchema } from "./schema";
import { encrypt } from "@/lib/crypto/encryption";

function revalidateFinance() {
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

// ----------------------------- Bank accounts -----------------------------

export async function saveBankAccount(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const parsed = bankAccountSchema.safeParse({
    bankName: formData.get("bankName"),
    accountType: formData.get("accountType"),
    nickname: formData.get("nickname") || undefined,
    last4: formData.get("last4") ?? "",
    balanceInr: formData.get("balanceInr"),
    accountNumber: formData.get("accountNumber") ?? "",
    ifsc: formData.get("ifsc") ?? "",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const d = parsed.data;
  const data: {
    bankName: string;
    accountType: typeof d.accountType;
    nickname: string | null;
    last4: string | null;
    balanceInr: Prisma.Decimal;
    asOf: Date;
    accountNumberEnc?: string;
    ifscEnc?: string;
  } = {
    bankName: d.bankName,
    accountType: d.accountType,
    nickname: d.nickname || null,
    last4: d.last4 ? d.last4 : null,
    balanceInr: new Prisma.Decimal(String(d.balanceInr)),
    asOf: new Date(),
  };

  if (d.accountNumber) {
    data.accountNumberEnc = encrypt(d.accountNumber);
  }
  if (d.ifsc) {
    data.ifscEnc = encrypt(d.ifsc.toUpperCase());
  }

  if (id) {
    const owned = await prisma.bankAccount.findFirst({
      where: { id, userId: user.id },
    });
    if (!owned) return { status: "error", message: "Account not found." };
    await prisma.bankAccount.update({ where: { id }, data });
  } else {
    await prisma.bankAccount.create({ data: { ...data, userId: user.id } });
  }

  revalidateFinance();
  return { status: "success" };
}

export async function deleteBankAccount(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.bankAccount.deleteMany({ where: { id, userId: user.id } });
  revalidateFinance();
}

// ----------------------------- Manual assets -----------------------------

export async function saveManualAsset(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const parsed = manualAssetSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    valueInr: formData.get("valueInr"),
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
  const data = {
    name: d.name,
    category: d.category,
    valueInr: new Prisma.Decimal(String(d.valueInr)),
    notes: d.notes || null,
    asOf: new Date(),
  };

  if (id) {
    const owned = await prisma.manualAsset.findFirst({
      where: { id, userId: user.id },
    });
    if (!owned) return { status: "error", message: "Asset not found." };
    await prisma.manualAsset.update({ where: { id }, data });
  } else {
    await prisma.manualAsset.create({ data: { ...data, userId: user.id } });
  }

  revalidateFinance();
  return { status: "success" };
}

export async function deleteManualAsset(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.manualAsset.deleteMany({ where: { id, userId: user.id } });
  revalidateFinance();
}
