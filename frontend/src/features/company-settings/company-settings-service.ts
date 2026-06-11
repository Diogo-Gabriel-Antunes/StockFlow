import { apiRequest } from "@/services/http";
import type { CompanySettings, CompanySettingsInput } from "./types";

export function getCompanySettings(token: string) {
  return apiRequest<CompanySettings>("/company/settings", { token });
}

export function updateCompanySettings(token: string, input: CompanySettingsInput) {
  return apiRequest<CompanySettings>("/company/settings", {
    method: "PUT",
    token,
    body: JSON.stringify(input),
  });
}
