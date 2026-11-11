"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { applyPreset, defaultPayload, FREELANCER } from "@/lib/defaults";
import { feeLabel, missingFields } from "@/lib/format";
import type { AgreementPayload, Preset } from "@/lib/types";
import { BrandMark } from "./BrandMark";
import { ContractPreview } from "./ContractPreview";
import { SignaturePad } from "./SignaturePad";

const DRAFT_KEY = "vs-terms-draft";
const ME_KEY = "vs-terms-me";

export function Builder() {
  const [data, setData] = useState<AgreementPayload>(defaultPayload);
  const [pane, setPane] = useState<"edit" | "preview">("edit");
  const [ready, setReady] = useState(false);
  const [signName, setSignName] = useState(FREELANCER.name);
  const [signature, setSignature] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [createdId, setCreatedId] = useState("");
  const [sentSigned, setSentSigned] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const draftRaw = localStorage.getItem(DRAFT_KEY);
    const meRaw = localStorage.getItem(ME_KEY);
    let next = defaultPayload();
    if (meRaw) {
      try {
        const me = JSON.parse(meRaw) as AgreementPayload["freelancer"];
        next = { ...next, freelancer: { ...next.freelancer, ...me } };
      } catch {
        /* ignore */
      }
    }
    if (draftRaw) {
      try {
        next = { ...next, ...(JSON.parse(draftRaw) as AgreementPayload) };
      } catch {
        /* ignore */
      }
    }
    setData(next);
    setSignName(next.freelancer.name);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  }, [data, ready]);

  const missing = useMemo(() => missingFields(data), [data]);

  function patch(partial: Partial<AgreementPayload>) {
    setData((prev) => ({ ...prev, ...partial }));
    setShareUrl("");
    setCreatedId("");
    setSentSigned(false);
  }

  function choosePreset(preset: Preset) {
    setData((prev) => applyPreset(prev, preset));
    setShareUrl("");
    setCreatedId("");
    setSentSigned(false);
  }

  function saveMe() {
    localStorage.setItem(ME_KEY, JSON.stringify(data.freelancer));
  }

  async function createLink() {
    setError("");
    setCopied(false);
    setBusy(true);
    try {
      const res = await fetch("/api/agreements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          payload: data,
          signature:
            signature && signName.trim() ? { name: signName.trim(), dataUrl: signature } : undefined,
        }),
      });
      const json = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !json.id) throw new Error(json.error || "Could not create the link.");
      const url = `${window.location.origin}/a/${json.id}`;
      setShareUrl(url);
      setCreatedId(json.id);
      setSentSigned(Boolean(signature && signName.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the link.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
  }

  async function attachSignature() {
    if (!createdId || !signature || !signName.trim()) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/agreements/${createdId}/sign`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ party: "freelancer", name: signName.trim(), dataUrl: signature }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Could not attach your signature.");
      setSentSigned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not attach your signature.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <a className="skip" href="#form">
        Skip to form
      </a>
      <header className="top">
        <div className="top-inner">
          <Link className="brand" href="/">
            <BrandMark />
            Terms
          </Link>
          <div className="presets" role="tablist" aria-label="Starting point">
            <button
              type="button"
              className={data.preset === "site" ? "pill on" : "pill"}
              onClick={() => choosePreset("site")}
            >
              Fix the site
            </button>
            <button
              type="button"
              className={data.preset === "stay" ? "pill on" : "pill"}
              onClick={() => choosePreset("stay")}
            >
              Stay on
            </button>
            <button
              type="button"
              className={data.preset === "custom" ? "pill on" : "pill"}
              onClick={() => choosePreset("custom")}
            >
              Custom
            </button>
          </div>
        </div>
      </header>

      <main className="wrap">
        <div className="mobile-switch">
          <button type="button" className={pane === "edit" ? "pill on" : "pill"} onClick={() => setPane("edit")}>
            Edit terms
          </button>
          <button
            type="button"
            className={pane === "preview" ? "pill on" : "pill"}
            onClick={() => setPane("preview")}
          >
            Preview
          </button>
        </div>

        <div className="workspace">
          <section className={pane === "preview" ? "form-pane hide" : "form-pane"} id="form">
            <p className="kicker">Client terms</p>
            <h1>Make the deal, then send it.</h1>
            <p className="lede">
              Same Freelance Services Agreement you already wrote. Toggle the job, watch the
              contract fill in, then send a link the client can sign.
            </p>

            <div className="section" style={{ marginTop: 0, paddingTop: 0, border: 0 }}>
              <h2>The job</h2>
              <p className="hint">What are you actually doing for them?</p>
              <label className="field">
                <span className="label">Defined services</span>
                <textarea
                  value={data.services}
                  onChange={(e) => patch({ services: e.target.value })}
                  placeholder="Put the new song on the site, update the shows, keep the inbox moving…"
                />
              </label>
              <label className="field">
                <span className="label">Target completion</span>
                <input
                  type="date"
                  value={data.targetCompletion}
                  onChange={(e) => patch({ targetCompletion: e.target.value })}
                />
              </label>
              <label className="field">
                <span className="label">Milestones or extra notes</span>
                <textarea
                  value={data.milestones}
                  onChange={(e) => patch({ milestones: e.target.value })}
                  placeholder="Optional. Deposit due on signing, rest when the site is live…"
                />
              </label>
            </div>

            <div className="section">
              <h2>How they pay</h2>
              <p className="hint">Hour based, project based, or retainer?</p>
              <Choice
                value={data.feeType}
                onChange={(feeType) =>
                  patch({
                    feeType,
                    paymentSchedule:
                      feeType === "retainer" ? "monthly" : feeType === "hourly" ? "biweekly" : "deposit",
                  })
                }
                options={[
                  { value: "hourly", label: "Hourly" },
                  { value: "project", label: "Project" },
                  { value: "retainer", label: "Retainer" },
                ]}
              />
              <div className="row">
                <label className="field">
                  <span className="label">{feeLabel(data.feeType)}</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={data.feeAmount}
                    onChange={(e) =>
                      patch({ feeAmount: e.target.value === "" ? "" : Number(e.target.value) })
                    }
                    placeholder="0"
                  />
                </label>
                <label className="field">
                  <span className="label">Hourly rate for extra revisions</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={data.revisionRate}
                    onChange={(e) =>
                      patch({ revisionRate: e.target.value === "" ? "" : Number(e.target.value) })
                    }
                    placeholder="Optional"
                  />
                </label>
              </div>
              <p className="label">Invoice rhythm</p>
              <Choice
                value={data.paymentSchedule}
                onChange={(paymentSchedule) => patch({ paymentSchedule })}
                options={[
                  { value: "deposit", label: "Deposit" },
                  { value: "milestones", label: "Milestones" },
                  { value: "biweekly", label: "Every two weeks" },
                  { value: "monthly", label: "Monthly" },
                ]}
              />
              {data.paymentSchedule === "deposit" ? (
                <label className="field">
                  <span className="label">Deposit percent</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={data.depositPercent}
                    onChange={(e) => patch({ depositPercent: Number(e.target.value) })}
                  />
                </label>
              ) : null}
              <p className="label">How long the client has to pay after the invoice is sent</p>
              <Choice
                value={String(data.invoiceDays)}
                onChange={(v) => patch({ invoiceDays: Number(v) })}
                options={[
                  { value: "7", label: "7 days" },
                  { value: "14", label: "14 days" },
                  { value: "21", label: "21 days" },
                  { value: "30", label: "30 days" },
                ]}
              />
              <label className="field">
                <span className="label">Or type a number of days</span>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={data.invoiceDays}
                  onChange={(e) => patch({ invoiceDays: Number(e.target.value) || 1 })}
                />
              </label>
            </div>

            <div className="section">
              <h2>How you work</h2>
              <p className="hint">In person or remote? Co-work or alone?</p>
              <p className="label">Where</p>
              <Choice
                value={data.location}
                onChange={(location) => patch({ location })}
                options={[
                  { value: "remote", label: "Remote" },
                  { value: "in_person", label: "In person" },
                  { value: "combo", label: "Combo" },
                ]}
              />
              <p className="label">With them, or on your own</p>
              <Choice
                value={data.workStyle}
                onChange={(workStyle) => patch({ workStyle })}
                options={[
                  { value: "independent", label: "Alone" },
                  { value: "cowork", label: "Co-work" },
                  { value: "combo", label: "Combo" },
                ]}
              />
            </div>

            <div className="section">
              <h2>People</h2>
              <p className="hint">You on the left of the page. Them on the right.</p>
              <p className="label">You</p>
              <div className="row">
                <Text
                  label="Name"
                  value={data.freelancer.name}
                  onChange={(name) => patch({ freelancer: { ...data.freelancer, name } })}
                />
                <Text
                  label="Email"
                  value={data.freelancer.email}
                  type="email"
                  onChange={(email) => patch({ freelancer: { ...data.freelancer, email } })}
                />
              </div>
              <Text
                label="Address"
                value={data.freelancer.address}
                onChange={(address) => patch({ freelancer: { ...data.freelancer, address } })}
              />
              <button type="button" className="pill" onClick={saveMe}>
                Save as my default
              </button>
              <p className="label" style={{ marginTop: 16 }}>
                Client
              </p>
              <div className="row">
                <Text
                  label="Name"
                  value={data.client.name}
                  onChange={(name) => patch({ client: { ...data.client, name } })}
                />
                <Text
                  label="Email"
                  value={data.client.email}
                  type="email"
                  onChange={(email) => patch({ client: { ...data.client, email } })}
                />
              </div>
              <Text
                label="Address"
                value={data.client.address}
                onChange={(address) => patch({ client: { ...data.client, address } })}
              />
              <label className="field">
                <span className="label">Effective date</span>
                <input
                  type="date"
                  value={data.effectiveDate}
                  onChange={(e) => patch({ effectiveDate: e.target.value })}
                />
              </label>
            </div>

            <div className="section">
              <h2>The fine print you actually change</h2>
              <div className="row">
                <Text
                  label="Review period (business days)"
                  value={String(data.reviewDays)}
                  type="number"
                  onChange={(v) => patch({ reviewDays: Number(v) || 1 })}
                />
                <Text
                  label="Revision rounds"
                  value={String(data.revisionRounds)}
                  type="number"
                  onChange={(v) => patch({ revisionRounds: Number(v) })}
                />
              </div>
              <div className="row">
                <Text
                  label="Termination notice (days)"
                  value={String(data.terminationDays)}
                  type="number"
                  onChange={(v) => patch({ terminationDays: Number(v) || 1 })}
                />
                <Text
                  label="Late fee % per month"
                  value={String(data.lateFeePercent)}
                  type="number"
                  onChange={(v) => patch({ lateFeePercent: Number(v) })}
                />
              </div>
              <Text
                label="Governing law"
                value={data.governingLaw}
                onChange={(governingLaw) => patch({ governingLaw })}
              />
              <label className="check">
                <input
                  type="checkbox"
                  checked={data.expensesReimbursable}
                  onChange={(e) => patch({ expensesReimbursable: e.target.checked })}
                />
                Client reimburses pre-approved expenses
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={data.portfolioRights}
                  onChange={(e) => patch({ portfolioRights: e.target.checked })}
                />
                You can show the work in your portfolio
              </label>
            </div>

            <div className="section">
              <h2>Sign and send</h2>
              <p className="hint">Sign first if you can. The client only signs their side on the link.</p>
              <Text label="Typed name" value={signName} onChange={setSignName} />
              <SignaturePad onChange={setSignature} />
            </div>

            <div className="actions">
              {missing.length ? (
                <p>Still needs {missing.join(", ")}.</p>
              ) : signature ? (
                <p>Ready to send. Your signature goes on the copy they get.</p>
              ) : (
                <p>You can send without signing. You can still sign later on this page.</p>
              )}
              {error ? <p className="warn">{error}</p> : null}
              <button type="button" className="btn" disabled={busy || missing.length > 0} onClick={createLink}>
                {busy ? "Making the link…" : "Create client link"}
              </button>
              {shareUrl ? (
                <div className="share-box">
                  <code>{shareUrl}</code>
                  <button type="button" className="btn light" onClick={copyLink}>
                    {copied ? "Copied" : "Copy link"}
                  </button>
                  <a className="btn ghost" href={shareUrl} style={{ textAlign: "center", textDecoration: "none" }}>
                    Open client page
                  </a>
                  {!sentSigned && signature && signName.trim() ? (
                    <button type="button" className="btn" disabled={busy} onClick={attachSignature}>
                      Attach my signature to this link
                    </button>
                  ) : null}
                  {sentSigned ? <p className="ok">Your signature is on the client copy.</p> : null}
                </div>
              ) : null}
            </div>
            <p className="disclaimer">
              This is the interactive version of your Freelance Services Agreement. It is a
              template, not legal advice. Have a lawyer look it over before you use it as a real
              contract.
            </p>
          </section>

          <aside className={pane === "edit" ? "preview-pane" : "preview-pane show"}>
            <div className="paper-top">
              <p className="kicker">Live contract</p>
              <button type="button" className="pill print-btn" onClick={() => window.print()}>
                Print / PDF
              </button>
            </div>
            <div className="paper">
              <ContractPreview
                data={data}
                highlight
                freelancerSignature={
                  signature
                    ? { name: signName || data.freelancer.name, dataUrl: signature, signedAt: null }
                    : null
                }
              />
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

function Choice<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="pills" style={{ marginBottom: 14 }}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? "pill on" : "pill"}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Text({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
