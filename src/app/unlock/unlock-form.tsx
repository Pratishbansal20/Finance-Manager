"use client";

import { useActionState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { unlockSession } from "@/lib/security/actions";
import { initialFormState } from "@/lib/forms/action-state";

export function UnlockForm() {
  const [state, formAction, pending] = useActionState(
    unlockSession,
    initialFormState,
  );

  // On success the server action calls redirect("/dashboard"), so we don't
  // need to handle success on the client side. But if it somehow does
  // return success, we can redirect manually as a fallback.
  useEffect(() => {
    if (state.status === "success") {
      window.location.href = "/dashboard";
    }
  }, [state]);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      {state.status === "error" && state.message && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-xs">
          {state.message}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="passphrase">Passphrase</Label>
        <Input
          id="passphrase"
          name="passphrase"
          type="password"
          autoComplete="current-password"
          autoFocus
          placeholder="Enter your passphrase"
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Verifying…" : "Unlock"}
      </Button>
    </form>
  );
}
