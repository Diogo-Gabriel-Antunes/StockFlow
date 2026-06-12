import { CustomerPortalQuoteDetailPage } from "@/features/customer-portal/customer-portal-quote-detail-page";

export default async function Page({
  params,
}: {
  params: Promise<{ quoteId: string; token: string }>;
}) {
  const { quoteId, token } = await params;
  return <CustomerPortalQuoteDetailPage quoteId={quoteId} token={token} />;
}
