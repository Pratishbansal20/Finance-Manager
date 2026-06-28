"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function initials(user: SessionUser): string {
  const base = user.name || user.email || "?";
  const parts = base.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

export function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="hover:ring-ring focus-visible:ring-ring flex size-8 items-center justify-center overflow-hidden rounded-full transition hover:ring-2 focus-visible:ring-2 focus-visible:outline-none"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "Account"}
            width={32}
            height={32}
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <span className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-full text-xs font-medium">
            {initials(user)}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="border-border bg-popover text-popover-foreground absolute right-0 top-10 z-20 w-56 overflow-hidden rounded-lg border shadow-lg"
        >
          <div className="border-border border-b px-3 py-2.5">
            <p className="truncate text-sm font-medium">
              {user.name ?? "Signed in"}
            </p>
            {user.email && (
              <p className="text-muted-foreground truncate text-xs">
                {user.email}
              </p>
            )}
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              role="menuitem"
              className="hover:bg-accent flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
