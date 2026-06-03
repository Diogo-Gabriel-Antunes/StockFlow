export type ServiceItem = {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  defaultPrice: number;
  estimatedCost: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ServiceItemFormInput = {
  name: string;
  description?: string;
  defaultPrice: string;
  estimatedCost: string;
};

export type ServiceItemInput = {
  name: string;
  description?: string;
  defaultPrice: number;
  estimatedCost: number;
};

export type ServiceItemPage = {
  items: ServiceItem[];
  page: number;
  size: number;
  total: number;
};
