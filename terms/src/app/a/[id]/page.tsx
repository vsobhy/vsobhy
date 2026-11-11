import { notFound } from "next/navigation";
import { ClientView } from "@/components/ClientView";
import { getAgreement } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agreement = await getAgreement(id);
  if (!agreement) notFound();
  return <ClientView initial={agreement} />;
}
