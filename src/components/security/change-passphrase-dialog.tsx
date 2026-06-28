"use client";

import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/fields";
import { FormDialog } from "@/components/forms/form-dialog";
import { changePassphrase } from "@/lib/security/actions";

/**
 * Change an existing passphrase. Requires the current passphrase first.
 */
export function ChangePassphraseDialog() {
  return (
    <FormDialog
      trigger="primary"
      label="Change passphrase"
      title="Change your passphrase"
      description="Enter your current passphrase and choose a new one."
      submitLabel="Change passphrase"
      action={changePassphrase}
    >
      {(state) => (
        <>
          <Field
            label="Current passphrase"
            htmlFor="current"
            error={state.fieldErrors?.current}
          >
            <Input
              id="current"
              name="current"
              type="password"
              autoComplete="current-password"
              placeholder="Enter current passphrase"
            />
          </Field>
          <Field
            label="New passphrase"
            htmlFor="passphrase"
            error={state.fieldErrors?.passphrase}
          >
            <Input
              id="passphrase"
              name="passphrase"
              type="password"
              autoComplete="new-password"
              placeholder="Enter a new passphrase"
              minLength={6}
            />
          </Field>
          <Field
            label="Confirm new passphrase"
            htmlFor="confirm"
            error={state.fieldErrors?.confirm}
          >
            <Input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter new passphrase"
            />
          </Field>
        </>
      )}
    </FormDialog>
  );
}
