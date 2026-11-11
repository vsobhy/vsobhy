import type { AgreementPayload, Party } from "./types";

export const FREELANCER: Party = {
  name: "Veronia Sobhy",
  email: "veroniasobhy.business@gmail.com",
  address: "Los Angeles, California",
  title: "Freelancer / Independent Contractor",
};

const SITE_SERVICES =
  "Website update for the current release and upcoming shows: put the song and next show on the front page, clean up the link page, and update the bio and contact so they match what's out now.";

const STAY_SERVICES =
  "Ongoing artist-buddy work on a month-to-month basis, including calendar and email, releases and sync, the site, socials, shows, and ads. Either party may stop with the notice in this Agreement.";

function today(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function emptyClient(): Party {
  return { name: "", email: "", address: "", title: "Authorized Representative" };
}

export function defaultPayload(): AgreementPayload {
  return {
    preset: "custom",
    effectiveDate: today(),
    freelancer: { ...FREELANCER },
    client: emptyClient(),
    services: "",
    feeType: "project",
    feeAmount: "",
    revisionRate: "",
    paymentSchedule: "deposit",
    depositPercent: 50,
    invoiceDays: 14,
    location: "remote",
    workStyle: "independent",
    reviewDays: 5,
    revisionRounds: 2,
    lateFeePercent: 1.5,
    expensesReimbursable: true,
    portfolioRights: true,
    terminationDays: 7,
    breachCureDays: 5,
    governingLaw: "California",
    targetCompletion: "",
    milestones: "",
  };
}

export function applyPreset(
  current: AgreementPayload,
  preset: AgreementPayload["preset"],
): AgreementPayload {
  const next = { ...current, preset, freelancer: { ...current.freelancer } };
  if (preset === "site") {
    return {
      ...next,
      services: SITE_SERVICES,
      feeType: "project",
      paymentSchedule: "deposit",
      depositPercent: 50,
      location: "remote",
      workStyle: "independent",
      reviewDays: 5,
      revisionRounds: 2,
    };
  }
  if (preset === "stay") {
    return {
      ...next,
      services: STAY_SERVICES,
      feeType: "retainer",
      paymentSchedule: "monthly",
      location: "remote",
      workStyle: "independent",
      reviewDays: 5,
      revisionRounds: 2,
    };
  }
  return {
    ...next,
    services: "",
    feeType: "project",
    paymentSchedule: "deposit",
  };
}
