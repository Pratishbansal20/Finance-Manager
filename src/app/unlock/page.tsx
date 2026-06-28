import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { auth } from "@/auth";
import { hasPassphrase } from "@/lib/security/queries";
import { UnlockForm } from "./unlock-form";

// The /unlock page lives outside the (dashboard) group so it isn't subject to
// requireUnlocked() (which would cause an infinite redirect loop). It still
// requires a signed-in user via auth().
export default async function UnlockPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // If the user hasn't set a passphrase yet, skip straight to dashboard.
  const hasPp = await hasPassphrase(session.user.id!);
  if (!hasPp) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6">
        <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl">
          <Lock className="size-7" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            Unlock your dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm text-balance">
            Enter your app passphrase to continue.
          </p>
        </div>
        <UnlockForm />
      </div>
    </div>
  );
}
