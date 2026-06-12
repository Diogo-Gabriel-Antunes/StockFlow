import { CustomerPortalRequestFormPage } from "@/features/customer-portal/customer-portal-request-form-page";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ productId?: string }>;
}) {
  const { token } = await params;
  const { productId } = await searchParams;
  return <CustomerPortalRequestFormPage initialProductId={productId} token={token} />;
}
