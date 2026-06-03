"use client";

import { useParams } from "next/navigation";
import { QuoteDetailPage } from "@/features/quotes/quote-detail-page";

export default function QuotePage() {
  const params = useParams<{ id: string }>();
  return <QuoteDetailPage id={params.id} />;
}
