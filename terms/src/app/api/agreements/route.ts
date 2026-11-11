import { createAgreement } from "@/lib/db";
import { assertSendable, parseSignature, pickPayload } from "@/lib/validate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send JSON." }, { status: 400 });
  }
  const raw = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const payload = pickPayload(raw.payload);
  const problem = assertSendable(payload);
  if (problem) return Response.json({ error: problem }, { status: 400 });

  let signature: { name: string; dataUrl: string } | undefined;
  if (raw.signature) {
    try {
      const parsed = parseSignature({ ...(raw.signature as object), party: "freelancer" });
      signature = { name: parsed.name, dataUrl: parsed.dataUrl };
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : "Signature did not save." },
        { status: 400 },
      );
    }
  }

  const agreement = await createAgreement(payload, signature);
  return Response.json({ id: agreement.id, agreement });
}
