import { signAgreement } from "@/lib/db";
import { assertSameOriginJson, readJsonBody } from "@/lib/http";
import { parseSignature } from "@/lib/validate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const blocked = assertSameOriginJson(request);
  if (blocked) return blocked;

  const { id } = await params;
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  let parsed: ReturnType<typeof parseSignature>;
  try {
    parsed = parseSignature(body.value);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not read the signature." },
      { status: 400 },
    );
  }

  const result = await signAgreement(id, parsed.name, parsed.dataUrl);
  if (result === "missing") return Response.json({ error: "Not found." }, { status: 404 });
  if (result === "already") {
    return Response.json({ error: "That side already signed." }, { status: 409 });
  }
  return Response.json({ agreement: result }, { headers: { "cache-control": "private, no-store" } });
}
