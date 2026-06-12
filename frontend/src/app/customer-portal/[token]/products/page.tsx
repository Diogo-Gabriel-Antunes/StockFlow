import { CustomerPortalProductsPage } from "@/features/customer-portal/customer-portal-products-page";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <CustomerPortalProductsPage token={token} />;
}
