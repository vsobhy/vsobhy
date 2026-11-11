import { signAgreement } from "@/lib/db";
import { parseSignature } from "@/lib/validate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send JSON." }, { status: 400 });
  }

  let parsed: ReturnType<typeof parseSignature>;
  try {
    parsed = parseSignature(body);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not read the signature." },
      { status: 400 },
    );
  }

  const result = await signAgreement(id, parsed.party, parsed.name, parsed.dataUrl);
  if (result === "missing") return Response.json({ error: "Not found." }, { status: 404 });
  if (result === "already") {
    return Response.json({ error: "That side already signed." }, { status: 409 });
  }
  return Response.json({ agreement: result }, { headers: { "cache-control": "private, no-store" } });
}
