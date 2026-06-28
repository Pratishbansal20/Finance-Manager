import { RefreshPricesButton } from "./refresh-prices-button";
import { UserMenu } from "./user-menu";
import { navItems } from "./nav-config";
import type { PricingStatus } from "@/lib/pricing/queries";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function currentTitle(pathname: string): string {
  const match = navItems.find(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`),
  );
  return match?.label ?? "Portfolio";
}

export function Topbar({
  user,
  pricingStatus,
  pathname,
}: {
  user: SessionUser;
  pricingStatus: PricingStatus;
  pathname: string;
}) {
  return (
    <header className="border-border bg-background/80 sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b px-5 backdrop-blur-sm md:px-8">
      <h1 className="text-base font-semibold tracking-tight">
        {currentTitle(pathname)}
      </h1>

      <div className="flex items-center gap-3">
        <RefreshPricesButton status={pricingStatus} />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
