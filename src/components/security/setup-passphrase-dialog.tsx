"use client";

import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/fields";
import { FormDialog } from "@/components/forms/form-dialog";
import { setupPassphrase } from "@/lib/security/actions";

/**
 * First-time passphrase setup (set + confirm). Shown when the user hasn't
 * set a passphrase yet. After setup, the current session is auto-unlocked
 * so the user isn't immediately locked out.
 */
export function SetupPassphraseDialog() {
  return (
    <FormDialog
      trigger="primary"
      label="Set passphrase"
      title="Set your app passphrase"
      description="This passphrase will be required every time you sign in, on top of Google login. Minimum 6 characters."
      submitLabel="Set passphrase"
      action={setupPassphrase}
    >
      {(state) => (
        <>
          <Field
            label="Passphrase"
            htmlFor="passphrase"
            error={state.fieldErrors?.passphrase}
          >
            <Input
              id="passphrase"
              name="passphrase"
              type="password"
              autoComplete="new-password"
              placeholder="Enter a passphrase"
              minLength={6}
            />
          </Field>
          <Field
            label="Confirm passphrase"
            htmlFor="confirm"
            error={state.fieldErrors?.confirm}
          >
            <Input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter passphrase"
            />
          </Field>
        </>
      )}
    </FormDialog>
  );
}
