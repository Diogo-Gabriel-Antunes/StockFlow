export type UserRole = "OWNER" | "ADMIN" | "MEMBER";

export type Company = {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  token: string;
  user: User;
  company: Company;
};

export type MeResponse = {
  user: User;
  company: Company;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  companyName: string;
  companyDocument?: string;
  companyEmail?: string;
  companyPhone?: string;
  ownerName: string;
  email: string;
  password: string;
};
