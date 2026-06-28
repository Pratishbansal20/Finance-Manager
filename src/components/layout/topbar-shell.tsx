"use client";

import { usePathname } from "next/navigation";
import { Topbar as TopbarInner } from "./topbar";
import type { PricingStatus } from "@/lib/pricing/queries";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function TopbarShell({
  user,
  pricingStatus,
}: {
  user: SessionUser;
  pricingStatus: PricingStatus;
}) {
  const pathname = usePathname();
  return (
    <TopbarInner user={user} pricingStatus={pricingStatus} pathname={pathname} />
  );
}
