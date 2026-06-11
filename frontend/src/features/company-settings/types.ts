export type CompanySettings = {
  tradeName: string;
  legalName: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  defaultQuoteNotes: string | null;
  defaultPaymentTerms: string | null;
  defaultQuoteValidityDays: number | null;
};

export type CompanySettingsInput = {
  tradeName: string;
  legalName?: string;
  document?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  addressNumber?: string;
  addressComplement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  defaultQuoteNotes?: string;
  defaultPaymentTerms?: string;
  defaultQuoteValidityDays?: number;
};
