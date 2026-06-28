// Shared shape for useActionState-driven form server actions.
export type FormActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialFormState: FormActionState = { status: "idle" };
