"use client";

import { useParams } from "next/navigation";
import { PublicQuotePage } from "@/features/quotes/public-quote-page";

export default function PublicQuoteRoutePage() {
  const params = useParams<{ token: string }>();
  return <PublicQuotePage token={params.token} />;
}
