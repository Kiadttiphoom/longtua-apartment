"use server";

import { createTrialRequest } from "@/lib/auth/create-trial-request";

export type RegisterState = {
  status: "idle" | "error" | "success";
  message?: string;
  fields?: Record<string, string>;
  values?: Record<string, string>;
};

export async function registerAction(_previous: RegisterState, formData: FormData): Promise<RegisterState> {
  const values: Record<string, string> = {};
  for (const key of ["username", "operatorName", "propertyName", "contactEmail", "phone"]) {
    const value = formData.get(key);
    values[key] = typeof value === "string" ? value : "";
  }
  const response = await createTrialRequest({
    ...values,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    accepted: formData.get("accepted") === "on",
  });
  const result = await response.json();
  if (!response.ok) return { status: "error", message: result.message, fields: result.fields, values };
  return { status: "success", message: result.message };
}
