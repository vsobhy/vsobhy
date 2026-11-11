import { allowCreate, createAgreement } from "@/lib/db";
import { assertSameOriginJson, clientIp, readJsonBody } from "@/lib/http";
import { assertSendable, parseSignature, pickPayload } from "@/lib/validate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const blocked = assertSameOriginJson(request);
  if (blocked) return blocked;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const ip = clientIp(request);
  const limit = await allowCreate(ip);
  if (limit) return Response.json({ error: limit }, { status: 429 });

  const raw = body.value && typeof body.value === "object" ? (body.value as Record<string, unknown>) : {};
  const payload = pickPayload(raw.payload);
  const problem = assertSendable(payload);
  if (problem) return Response.json({ error: problem }, { status: 400 });

  let signature: { name: string; dataUrl: string } | undefined;
  if (raw.signature) {
    try {
      signature = parseSignature(raw.signature);
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : "Signature did not save." },
        { status: 400 },
      );
    }
  }

  const created = await createAgreement(payload, signature, ip);
  return Response.json({
    clientToken: created.clientToken,
    freelancerToken: created.freelancerToken,
    agreement: created.agreement,
  });
}
