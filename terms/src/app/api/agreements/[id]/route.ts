import { getAgreement } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const agreement = await getAgreement(id);
  if (!agreement) return Response.json({ error: "Not found." }, { status: 404 });
  return Response.json({ agreement }, { headers: { "cache-control": "private, no-store" } });
}
