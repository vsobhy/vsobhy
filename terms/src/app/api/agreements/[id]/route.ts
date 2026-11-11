import { getAgreementByToken } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await getAgreementByToken(id);
  if (!access) return Response.json({ error: "Not found." }, { status: 404 });
  return Response.json(
    { agreement: access.agreement, role: access.role },
    { headers: { "cache-control": "private, no-store" } },
  );
}
