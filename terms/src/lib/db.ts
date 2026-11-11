import { randomBytes } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import type { AgreementPayload, AgreementRecord } from "./types";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";

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

export function newId(): string {
  return randomBytes(18).toString("base64url");
}

export async function createAgreement(
  payload: AgreementPayload,
  signature?: { name: string; dataUrl: string },
): Promise<AgreementRecord> {
  const id = newId();
  const rows = await sql<Row>(
    `insert into agreements (
       id, payload,
       freelancer_signed_name, freelancer_signature, freelancer_signed_at
     ) values ($1, $2, $3, $4, $5)
     returning *`,
    [
      id,
      JSON.stringify(payload),
      signature?.name ?? null,
      signature?.dataUrl ?? null,
      signature ? new Date().toISOString() : null,
    ],
  );
  return mapRow(rows[0]);
}

export async function getAgreement(id: string): Promise<AgreementRecord | null> {
  if (!id || id.length > 64) return null;
  const rows = await sql<Row>(`select * from agreements where id = $1`, [id]);
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function signAgreement(
  id: string,
  party: "freelancer" | "client",
  name: string,
  dataUrl: string,
): Promise<AgreementRecord | "missing" | "already"> {
  const existing = await getAgreement(id);
  if (!existing) return "missing";
  if (party === "freelancer" && existing.freelancerSignedAt) return "already";
  if (party === "client" && existing.clientSignedAt) return "already";
  const now = new Date().toISOString();
  const rows =
    party === "freelancer"
      ? await sql<Row>(
          `update agreements
           set freelancer_signed_name = $1,
               freelancer_signature = $2,
               freelancer_signed_at = $3
           where id = $4 and freelancer_signed_at is null
           returning *`,
          [name, dataUrl, now, id],
        )
      : await sql<Row>(
          `update agreements
           set client_signed_name = $1,
               client_signature = $2,
               client_signed_at = $3
           where id = $4 and client_signed_at is null
           returning *`,
          [name, dataUrl, now, id],
        );
  if (!rows[0]) return "already";
  return mapRow(rows[0]);
}
