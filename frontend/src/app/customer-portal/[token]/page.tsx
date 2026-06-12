import { CustomerPortalPage } from "@/features/customer-portal/customer-portal-page";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <CustomerPortalPage token={token} />;
}
