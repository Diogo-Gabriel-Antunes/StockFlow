export type CustomerType = "PERSON" | "COMPANY";

export type Customer = {
  id: string;
  companyId: string;
  name: string;
  type: CustomerType;
  document: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerInput = {
  name: string;
  type: CustomerType;
  document?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
  state?: string;
  notes?: string;
};

export type CustomerPage = {
  items: Customer[];
  page: number;
  size: number;
  total: number;
};
