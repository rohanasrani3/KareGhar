import { CATEGORIES } from "@/contract/artForms";
import type { Form } from "@/contract/schemas";

/** Keep copied URLs, repeated query keys and dependent controls consistent. */
export function directoryFilters(all: Form[], params: { category?: unknown; form?: unknown; status?: unknown }) {
  const category = typeof params.category === "string" && Object.hasOwn(CATEGORIES, params.category) ? params.category : "";
  const selectedForm = typeof params.form === "string" ? all.find((form) => form.id === params.form && (!category || form.category === category)) : undefined;
  return {
    category: category || selectedForm?.category || "",
    form: selectedForm?.id || "",
    status: params.status === "finding" || params.status === "done" ? params.status : "",
  };
}
