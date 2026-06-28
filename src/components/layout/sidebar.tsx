"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-config";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar border-border hidden w-60 shrink-0 flex-col border-r md:flex">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="bg-primary/15 text-primary flex size-8 items-center justify-center rounded-lg">
          <PieChart className="size-4.5" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight">
          Portfolio
        </span>
      </div>

      {/* Primary nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <Icon className="size-4.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="text-muted-foreground border-border border-t px-5 py-4 text-xs">
        V1 · Personal build
      </div>
    </aside>
  );
}
