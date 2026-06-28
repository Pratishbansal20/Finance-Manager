import {
  LayoutDashboard,
  TrendingUp,
  Landmark,
  CreditCard,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

// Primary navigation for the finance hub.
export const navItems: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Investments", href: "/holdings", icon: TrendingUp },
  { label: "Accounts", href: "/accounts", icon: Landmark },
  { label: "Cards", href: "/cards", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
];
