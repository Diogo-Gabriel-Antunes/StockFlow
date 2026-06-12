import { CustomerPortalRequestFormPage } from "@/features/customer-portal/customer-portal-request-form-page";

export default async function Page({
  params,
}: {
  params: Promise<{ requestId: string; token: string }>;
}) {
  const { requestId, token } = await params;
  return <CustomerPortalRequestFormPage requestId={requestId} token={token} />;
}
