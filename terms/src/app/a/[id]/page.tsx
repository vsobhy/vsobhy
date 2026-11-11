import { notFound } from "next/navigation";
import { ClientView } from "@/components/ClientView";
import { getAgreementByToken } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await getAgreementByToken(id);
  if (!access) notFound();
  return <ClientView initial={access.agreement} role={access.role} accessToken={id} />;
}
