const MAX_JSON_BYTES = 400_000;

function canonicalHost(raw: string): string {
  const trimmed = raw.split(",")[0].trim().toLowerCase();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `http://${trimmed}`);
    const port = url.port;
    if (!port || port === "80" || port === "443") return url.hostname;
    return `${url.hostname}:${port}`;
  } catch {
    return trimmed.replace(/:(80|443)$/, "");
  }
}

export function assertSameOriginJson(request: Request): Response | null {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return Response.json({ error: "Send JSON." }, { status: 415 });
  }
  const originHeader = request.headers.get("origin");
  if (!originHeader) {
    return Response.json({ error: "Missing origin." }, { status: 403 });
  }
  const originHost = canonicalHost(originHeader);
  const forwarded = request.headers.get("x-forwarded-host") || "";
  const host = canonicalHost(forwarded) || canonicalHost(request.headers.get("host") || "");
  if (!originHost || !host || originHost !== host) {
    return Response.json({ error: "Bad origin." }, { status: 403 });
  }
  return null;
}

export async function readJsonBody(request: Request): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  const declared = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(declared) && declared > MAX_JSON_BYTES) {
    return { ok: false, response: Response.json({ error: "That request is too large." }, { status: 413 }) };
  }
  const text = await request.text();
  if (text.length > MAX_JSON_BYTES) {
    return { ok: false, response: Response.json({ error: "That request is too large." }, { status: 413 }) };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, response: Response.json({ error: "Send JSON." }, { status: 400 }) };
  }
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim().slice(0, 64) || "unknown";
  const real = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip");
  if (real) return real.trim().slice(0, 64) || "unknown";
  return "unknown";
}
