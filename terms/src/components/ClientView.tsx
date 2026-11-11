"use client";

import Link from "next/link";
import { useState } from "react";
import { formatStamp } from "@/lib/format";
import type { AccessRole, AgreementRecord } from "@/lib/types";
import { BrandMark } from "./BrandMark";
import { ContractPreview } from "./ContractPreview";
import { SignaturePad } from "./SignaturePad";

export function ClientView({
  initial,
  role,
  accessToken,
}: {
  initial: AgreementRecord;
  role: AccessRole;
  accessToken: string;
}) {
  const [record, setRecord] = useState(initial);
  const [name, setName] = useState(
    role === "client" ? initial.payload.client.name : initial.payload.freelancer.name,
  );
  const [signature, setSignature] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const bothSigned = Boolean(record.freelancerSignedAt && record.clientSignedAt);
  const firstName = record.payload.freelancer.name.split(" ")[0] || "freelancer";
  const alreadySigned = role === "client" ? Boolean(record.clientSignedAt) : Boolean(record.freelancerSignedAt);
  const signerLabel = role === "client" ? record.payload.client.name || "the client" : record.payload.freelancer.name;
  const waitingOn =
    role === "client" ? firstName : record.payload.client.name.split(" ")[0] || "the client";

  async function sign() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/agreements/${accessToken}/sign`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, dataUrl: signature }),
      });
      const json = (await res.json()) as { agreement?: AgreementRecord; error?: string };
      if (!res.ok || !json.agreement) throw new Error(json.error || "Could not save the signature.");
      setRecord(json.agreement);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the signature.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="top">
        <div className="top-inner">
          <Link className="brand" href="/">
            <BrandMark />
            Terms
          </Link>
          <div className="presets">
            {bothSigned ? (
              <span className="status">Signed by both sides</span>
            ) : alreadySigned ? (
              <span className="status">You signed · waiting on {waitingOn}</span>
            ) : (
              <span className="status wait">Needs your signature</span>
            )}
            <button type="button" className="pill" onClick={() => window.print()}>
              Print / PDF
            </button>
          </div>
        </div>
      </header>

      <main className="wrap" style={{ maxWidth: 920 }}>
        <p className="kicker">
          Agreement for {record.payload.client.name || "you"}
        </p>
        <h1>Read it. Sign it. Done.</h1>
        <p className="lede">
          {role === "client"
            ? `${record.payload.freelancer.name} sent this Freelance Services Agreement. Read it, then sign at the bottom if you agree. You can print a copy after.`
            : "This is your signing link for this Freelance Services Agreement. The client link cannot sign your side."}
        </p>
        {bothSigned ? (
          <p className="ok" style={{ marginBottom: 18 }}>
            Fully signed
            {alreadySigned && role === "client" && record.clientSignedAt
              ? ` · you on ${formatStamp(record.clientSignedAt)}`
              : alreadySigned && record.freelancerSignedAt
                ? ` · you on ${formatStamp(record.freelancerSignedAt)}`
                : ""}
            . Print a copy for your records.
          </p>
        ) : null}

        <div className="paper">
          <ContractPreview
            data={record.payload}
            freelancerSignature={
              record.freelancerSignature
                ? {
                    name: record.freelancerSignedName || record.payload.freelancer.name,
                    dataUrl: record.freelancerSignature,
                    signedAt: record.freelancerSignedAt,
                  }
                : null
            }
            clientSignature={
              record.clientSignature
                ? {
                    name: record.clientSignedName || record.payload.client.name,
                    dataUrl: record.clientSignature,
                    signedAt: record.clientSignedAt,
                  }
                : null
            }
          />
        </div>

        {alreadySigned ? null : (
          <section className="sign-card">
            <p className="kicker">{role === "client" ? "Client signature" : "Your signature"}</p>
            <h2 className="display" style={{ fontSize: 28, margin: "8px 0 12px" }}>
              Sign as {signerLabel}
            </h2>
            <label className="field">
              <span className="label">Typed name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <SignaturePad onChange={setSignature} />
            {error ? <p className="warn">{error}</p> : null}
            <button
              type="button"
              className="btn"
              style={{ marginTop: 12 }}
              disabled={busy || !signature || !name.trim()}
              onClick={sign}
            >
              {busy ? "Saving…" : "Agree and sign"}
            </button>
          </section>
        )}
      </main>
    </>
  );
}
