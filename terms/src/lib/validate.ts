import type {
  AgreementPayload,
  FeeType,
  LocationType,
  Party,
  PaymentSchedule,
  Preset,
  WorkStyle,
} from "./types";
import { defaultPayload } from "./defaults";

const FEE: FeeType[] = ["hourly", "project", "retainer"];
const LOC: LocationType[] = ["remote", "in_person", "combo"];
const WORK: WorkStyle[] = ["independent", "cowork", "combo"];
const SCHED: PaymentSchedule[] = ["deposit", "milestones", "monthly", "biweekly"];
const PRESET: Preset[] = ["site", "stay", "custom"];

function str(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\0/g, "").slice(0, max).trim();
}

function num(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function amount(value: unknown): number | "" {
  if (value === "" || value === null || value === undefined) return "";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 10_000_000) return "";
  return Math.round(n * 100) / 100;
}

function one<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function party(value: unknown, fallback: Party): Party {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    name: str(raw.name, 120),
    email: str(raw.email, 200),
    address: str(raw.address, 500),
    title: str(raw.title, 80) || fallback.title,
  };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function pickPayload(input: unknown): AgreementPayload {
  const base = defaultPayload();
  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  return {
    preset: one(raw.preset, PRESET, "custom"),
    effectiveDate: str(raw.effectiveDate, 10),
    freelancer: party(raw.freelancer, base.freelancer),
    client: party(raw.client, base.client),
    services: str(raw.services, 8000),
    feeType: one(raw.feeType, FEE, "project"),
    feeAmount: amount(raw.feeAmount),
    revisionRate: amount(raw.revisionRate),
    paymentSchedule: one(raw.paymentSchedule, SCHED, "deposit"),
    depositPercent: num(raw.depositPercent, 0, 100, 50),
    invoiceDays: num(raw.invoiceDays, 1, 90, 14),
    location: one(raw.location, LOC, "remote"),
    workStyle: one(raw.workStyle, WORK, "independent"),
    reviewDays: num(raw.reviewDays, 1, 30, 5),
    revisionRounds: num(raw.revisionRounds, 0, 10, 2),
    lateFeePercent: num(raw.lateFeePercent, 0, 10, 1.5),
    expensesReimbursable: Boolean(raw.expensesReimbursable),
    portfolioRights: raw.portfolioRights !== false,
    terminationDays: num(raw.terminationDays, 1, 90, 7),
    breachCureDays: num(raw.breachCureDays, 1, 30, 5),
    governingLaw: str(raw.governingLaw, 80) || "California",
    targetCompletion: str(raw.targetCompletion, 10),
    milestones: str(raw.milestones, 4000),
  };
}

export function assertSendable(data: AgreementPayload): string | null {
  if (!data.freelancer.name) return "Add your name.";
  if (!EMAIL.test(data.freelancer.email)) return "Add a valid email for you.";
  if (!data.client.name) return "Add the client's name.";
  if (!EMAIL.test(data.client.email)) return "Add a valid email for the client.";
  if (!data.services) return "Describe the services.";
  if (data.feeAmount === "" || Number(data.feeAmount) <= 0) return "Add the fee.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.effectiveDate)) return "Add the effective date.";
  return null;
}

export function parseSignature(body: unknown): { name: string; dataUrl: string } {
  const raw = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const name = str(raw.name, 120);
  const dataUrl = typeof raw.dataUrl === "string" ? raw.dataUrl : "";
  if (!name) throw new Error("Type the signer's name.");
  if (!dataUrl.startsWith("data:image/png;base64,") && !dataUrl.startsWith("data:image/jpeg;base64,")) {
    throw new Error("Draw a signature.");
  }
  if (dataUrl.length > 350_000) throw new Error("Signature is too large. Draw it again.");
  return { name, dataUrl };
}
