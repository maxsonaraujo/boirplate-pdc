'use client';

import FormCheckout from "@/components/delivery/FormCheckout";

export default function CheckoutPage({ params }: { params: { slug: string } }) {
  return <FormCheckout params={params} />;
}