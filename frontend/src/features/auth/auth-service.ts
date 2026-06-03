import { apiRequest } from "@/services/http";
import type {
  AuthResponse,
  LoginInput,
  MeResponse,
  RegisterInput,
} from "./types";

export function login(input: LoginInput) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function register(input: RegisterInput) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getMe(token: string) {
  return apiRequest<MeResponse>("/auth/me", { token });
}
