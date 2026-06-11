export type Product = {
  id: string;
  companyId: string;
  name: string;
  sku: string | null;
  category: string | null;
  barcode: string | null;
  referenceCode: string | null;
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
  barcode?: string;
  referenceCode?: string;
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
  barcode?: string;
  referenceCode?: string;
  costPrice: number;
  salePrice: number;
  unit: string;
  stockQuantity: number;
  minimumStock: number;
};

export type ProductPage = {
  items: Product[];
  content?: Product[];
  page: number;
  size: number;
  total: number;
  totalElements?: number;
  totalPages?: number;
  first?: boolean;
  last?: boolean;
};
