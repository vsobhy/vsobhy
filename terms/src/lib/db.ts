import { randomBytes } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import type { AccessRole, AgreementPayload, AgreementRecord } from "./types";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
const HOUR_LIMIT = 10;
const DAY_LIMIT = 40;
const GLOBAL_DAY_LIMIT = 200;
const MAX_AGREEMENTS = 2000;

const globalForDb = globalThis as unknown as {
  __vsTermsPool?: pg.Pool;
  __vsTermsPglite?: Promise<PGlite>;
};

type Row = {
  id: string;
  payload: string;
  freelancer_signed_name: string | null;
  freelancer_signature: string | null;
  freelancer_signed_at: Date | string | null;
  client_signed_name: string | null;
  client_signature: string | null;
  client_signed_at: Date | string | null;
  created_at: Date | string;
  client_token: string;
  freelancer_token: string;
};

export type CreatedAgreement = {
  clientToken: string;
  freelancerToken: string;
  agreement: AgreementRecord;
};

export type TokenAccess = {
  role: AccessRole;
  agreement: AgreementRecord;
};

export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (databaseUrl !== "") {
    globalForDb.__vsTermsPool ??= new pg.Pool({ connectionString: databaseUrl, max: 5 });
    return (await globalForDb.__vsTermsPool.query(text, params)).rows as T[];
  }
  globalForDb.__vsTermsPglite ??= startLocal().catch((error: unknown) => {
    globalForDb.__vsTermsPglite = undefined;
    throw error;
  });
  return (await (await globalForDb.__vsTermsPglite).query<T>(text, params)).rows;
}

async function startLocal(): Promise<PGlite> {
  const db = new PGlite(path.join(process.cwd(), ".pglite"));
  const files = (await readdir("migrations").catch(() => []))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    await db.exec(await readFile(`migrations/${file}`, "utf8"));
  }
  return db;
}

function stamp(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

function mapRow(row: Row): AgreementRecord {
  let payload: AgreementPayload;
  try {
    payload = JSON.parse(row.payload) as AgreementPayload;
  } catch {
    throw new Error("Stored agreement is unreadable.");
  }
  return {
    id: row.id,
    payload,
    freelancerSignedName: row.freelancer_signed_name,
    freelancerSignature: row.freelancer_signature,
    freelancerSignedAt: stamp(row.freelancer_signed_at),
    clientSignedName: row.client_signed_name,
    clientSignature: row.client_signature,
    clientSignedAt: stamp(row.client_signed_at),
    createdAt: stamp(row.created_at) ?? new Date().toISOString(),
  };
}

function looksLikeToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{16,80}$/.test(token);
}

export function newId(): string {
  return randomBytes(18).toString("base64url");
}

export async function allowCreate(ip: string): Promise<string | null> {
  await sql(`delete from create_attempts where created_at < now() - interval '2 days'`);
  const [{ n: total }] = await sql<{ n: string | number }>(`select count(*)::int as n from agreements`);
  if (Number(total) >= MAX_AGREEMENTS) {
    return "The terms book is full. Try again later.";
  }
  const [{ n: globalDay }] = await sql<{ n: string | number }>(
    `select count(*)::int as n from create_attempts where created_at > now() - interval '1 day'`,
  );
  if (Number(globalDay) >= GLOBAL_DAY_LIMIT) {
    return "Too many agreements today. Try again tomorrow.";
  }
  const [{ n: hour }] = await sql<{ n: string | number }>(
    `select count(*)::int as n from create_attempts where ip = $1 and created_at > now() - interval '1 hour'`,
    [ip],
  );
  if (Number(hour) >= HOUR_LIMIT) {
    return "Too many agreements from here. Wait an hour.";
  }
  const [{ n: day }] = await sql<{ n: string | number }>(
    `select count(*)::int as n from create_attempts where ip = $1 and created_at > now() - interval '1 day'`,
    [ip],
  );
  if (Number(day) >= DAY_LIMIT) {
    return "Too many agreements from here today.";
  }
  return null;
}

export async function createAgreement(
  payload: AgreementPayload,
  signature: { name: string; dataUrl: string } | undefined,
  ip: string,
): Promise<CreatedAgreement> {
  const id = newId();
  const clientToken = newId();
  const freelancerToken = newId();
  const rows = await sql<Row>(
    `insert into agreements (
       id, payload, client_token, freelancer_token,
       freelancer_signed_name, freelancer_signature, freelancer_signed_at
     ) values ($1, $2, $3, $4, $5, $6, $7)
     returning *`,
    [
      id,
      JSON.stringify(payload),
      clientToken,
      freelancerToken,
      signature?.name ?? null,
      signature?.dataUrl ?? null,
      signature ? new Date().toISOString() : null,
    ],
  );
  await sql(`insert into create_attempts (ip) values ($1)`, [ip]);
  return { clientToken, freelancerToken, agreement: mapRow(rows[0]) };
}

export async function getAgreementByToken(token: string): Promise<TokenAccess | null> {
  if (!looksLikeToken(token)) return null;
  const rows = await sql<Row>(
    `select * from agreements where client_token = $1 or freelancer_token = $1`,
    [token],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    role: row.client_token === token ? "client" : "freelancer",
    agreement: mapRow(row),
  };
}

export async function signAgreement(
  token: string,
  name: string,
  dataUrl: string,
): Promise<AgreementRecord | "missing" | "already"> {
  const access = await getAgreementByToken(token);
  if (!access) return "missing";
  if (access.role === "freelancer" && access.agreement.freelancerSignedAt) return "already";
  if (access.role === "client" && access.agreement.clientSignedAt) return "already";
  const now = new Date().toISOString();
  const rows =
    access.role === "freelancer"
      ? await sql<Row>(
          `update agreements
           set freelancer_signed_name = $1,
               freelancer_signature = $2,
               freelancer_signed_at = $3
           where freelancer_token = $4 and freelancer_signed_at is null
           returning *`,
          [name, dataUrl, now, token],
        )
      : await sql<Row>(
          `update agreements
           set client_signed_name = $1,
               client_signature = $2,
               client_signed_at = $3
           where client_token = $4 and client_signed_at is null
           returning *`,
          [name, dataUrl, now, token],
        );
  if (!rows[0]) return "already";
  return mapRow(rows[0]);
}
