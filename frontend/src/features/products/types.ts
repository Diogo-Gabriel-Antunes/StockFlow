export type Product = {
  id: string;
  companyId: string;
  name: string;
  sku: string | null;
  category: string | null;
  costPrice: number;
  salePrice: number;
  unit: string;
  stockQuantity: number;
  minimumStock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductFormInput = {
  name: string;
  sku?: string;
  category?: string;
  costPrice: string;
  salePrice: string;
  unit: string;
  stockQuantity: string;
  minimumStock: string;
};

export type ProductInput = {
  name: string;
  sku?: string;
  category?: string;
  costPrice: number;
  salePrice: number;
  unit: string;
  stockQuantity: number;
  minimumStock: number;
};

export type ProductPage = {
  items: Product[];
  page: number;
  size: number;
  total: number;
};
