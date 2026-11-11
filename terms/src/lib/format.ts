import type { AgreementPayload } from "./types";

export function formatMoney(amount: number | "", fallback = "the agreed fee"): string {
  if (amount === "" || amount === null || Number.isNaN(Number(amount))) return fallback;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

export function formatDate(iso: string, fallback = "the Effective Date"): string {
  if (!iso) return fallback;
  const parts = iso.split("-").map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return fallback;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatStamp(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function slot(value: string, fallback = "____________"): string {
  const v = value.trim();
  return v ? v : fallback;
}

export function feeLabel(feeType: AgreementPayload["feeType"]): string {
  if (feeType === "hourly") return "Hourly rate";
  if (feeType === "retainer") return "Monthly retainer";
  return "Project fee";
}

export function feePhrase(data: AgreementPayload): string {
  const amount = formatMoney(data.feeAmount);
  if (data.feeType === "hourly") return `an hourly rate of ${amount}`;
  if (data.feeType === "retainer") return `a monthly retainer of ${amount}`;
  return `a flat project fee of ${amount}`;
}

export function locationPhrase(data: AgreementPayload): string {
  if (data.location === "in_person") {
    return "Services will be performed in person at a location agreed by the parties, unless the parties agree in writing that specific work will be remote.";
  }
  if (data.location === "combo") {
    return "Services may be performed remotely or in person, as agreed between the parties.";
  }
  return "Services will be performed remotely unless explicitly agreed in writing.";
}

export function workStylePhrase(data: AgreementPayload): string {
  if (data.workStyle === "cowork") {
    return "The parties may collaborate in shared working sessions. The Freelancer remains an independent contractor and retains sole control over the time, method, and manner of performing the Services.";
  }
  if (data.workStyle === "combo") {
    return "The Freelancer may work independently and in collaborative sessions with Client, as needed. The Freelancer retains sole control over the time, method, and manner of performing the Services.";
  }
  return "The Freelancer retains sole control over the time, method, and manner of performing the Services, and will perform the Services independently.";
}

export function invoicePhrase(data: AgreementPayload): string {
  if (data.paymentSchedule === "biweekly") {
    return "Freelancer will invoice Client every two weeks.";
  }
  if (data.paymentSchedule === "monthly") {
    return "Freelancer will invoice Client monthly.";
  }
  if (data.paymentSchedule === "milestones") {
    return "Freelancer will invoice Client upon completion of the milestones described in Exhibit A.";
  }
  return `Freelancer will invoice a ${data.depositPercent}% deposit upon signing, with the remaining balance invoiced according to Exhibit A.`;
}

export function scheduleLabel(data: AgreementPayload): string {
  if (data.paymentSchedule === "deposit") return `Deposit (${data.depositPercent}%) / remainder`;
  if (data.paymentSchedule === "milestones") return "Milestones";
  if (data.paymentSchedule === "monthly") return "Monthly";
  return "Bi-weekly";
}

export function missingFields(data: AgreementPayload): string[] {
  const missing: string[] = [];
  if (!data.freelancer.name.trim()) missing.push("your name");
  if (!data.freelancer.email.trim()) missing.push("your email");
  if (!data.client.name.trim()) missing.push("client name");
  if (!data.client.email.trim()) missing.push("client email");
  if (!data.services.trim()) missing.push("the services");
  if (data.feeAmount === "" || Number(data.feeAmount) <= 0) missing.push("the fee");
  if (!data.effectiveDate) missing.push("the effective date");
  return missing;
}
