"use client";

import { Input } from "@/components/ui/input";
import { Field, selectClass } from "@/components/forms/fields";
import { FormDialog } from "@/components/forms/form-dialog";
import { saveCreditScore } from "@/lib/credit/actions";
import { CREDIT_BUREAU_LABELS } from "@/lib/credit/constants";

export function CreditScoreDialog({
  trigger = "primary",
  label = "Update score",
}: {
  trigger?: "primary" | "icon";
  label?: string;
}) {
  return (
    <FormDialog
      trigger={trigger}
      label={label}
      title="Record credit score"
      description="Adds a dated entry; the latest per bureau shows as current."
      submitLabel="Save score"
      action={saveCreditScore}
    >
      {(state) => (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bureau" htmlFor="bureau">
              <select
                id="bureau"
                name="bureau"
                defaultValue="CIBIL"
                className={selectClass}
              >
                {Object.entries(CREDIT_BUREAU_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Score (300–900)"
              htmlFor="score"
              error={state.fieldErrors?.score}
            >
              <Input
                id="score"
                name="score"
                type="number"
                min="300"
                max="900"
                placeholder="780"
              />
            </Field>
          </div>
        </>
      )}
    </FormDialog>
  );
}
