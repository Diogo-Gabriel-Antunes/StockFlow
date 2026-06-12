export type Product = {
  id: string;
  companyId: string;
  name: string;
  sku: string | null;
  category: string | null;
  description: string | null;
  barcode: string | null;
  referenceCode: string | null;
  imageUrl: string | null;
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
  description?: string;
  barcode?: string;
  referenceCode?: string;
  imageUrl?: string;
  costPrice: string;
  salePrice: string;
  unit: string;
  stockQuantity: string;
  minimumStock: string;
  active?: boolean;
};

export type ProductInput = {
  name: string;
  sku?: string;
  category?: string;
  description?: string;
  barcode?: string;
  referenceCode?: string;
  imageUrl?: string;
  costPrice: number;
  salePrice: number;
  unit: string;
  stockQuantity: number;
  minimumStock: number;
  active?: boolean;
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
