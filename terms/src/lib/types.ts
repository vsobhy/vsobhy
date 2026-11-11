export type FeeType = "hourly" | "project" | "retainer";
export type LocationType = "remote" | "in_person" | "combo";
export type WorkStyle = "independent" | "cowork" | "combo";
export type PaymentSchedule = "deposit" | "milestones" | "monthly" | "biweekly";
export type Preset = "site" | "stay" | "custom";

export type Party = {
  name: string;
  email: string;
  address: string;
  title: string;
};

export type AgreementPayload = {
  preset: Preset;
  effectiveDate: string;
  freelancer: Party;
  client: Party;
  services: string;
  feeType: FeeType;
  feeAmount: number | "";
  revisionRate: number | "";
  paymentSchedule: PaymentSchedule;
  depositPercent: number;
  invoiceDays: number;
  location: LocationType;
  workStyle: WorkStyle;
  reviewDays: number;
  revisionRounds: number;
  lateFeePercent: number;
  expensesReimbursable: boolean;
  portfolioRights: boolean;
  terminationDays: number;
  breachCureDays: number;
  governingLaw: string;
  targetCompletion: string;
  milestones: string;
};

export type AgreementRecord = {
  id: string;
  payload: AgreementPayload;
  freelancerSignedName: string | null;
  freelancerSignature: string | null;
  freelancerSignedAt: string | null;
  clientSignedName: string | null;
  clientSignature: string | null;
  clientSignedAt: string | null;
  createdAt: string;
};
