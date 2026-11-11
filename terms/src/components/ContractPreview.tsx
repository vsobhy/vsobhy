import type { AgreementPayload } from "@/lib/types";
import {
  feePhrase,
  formatDate,
  formatMoney,
  formatStamp,
  invoicePhrase,
  locationPhrase,
  scheduleLabel,
  slot,
  workStylePhrase,
} from "@/lib/format";

type Props = {
  data: AgreementPayload;
  highlight?: boolean;
  freelancerSignature?: { name: string; dataUrl: string; signedAt: string | null } | null;
  clientSignature?: { name: string; dataUrl: string; signedAt: string | null } | null;
};

function Term({
  value,
  highlight,
  fallback = "____________",
}: {
  value: string;
  highlight?: boolean;
  fallback?: string;
}) {
  const filled = Boolean(value.trim());
  const text = filled ? value.trim() : fallback;
  if (!highlight) return <strong className="fill">{text}</strong>;
  return <strong className={filled ? "term" : "term empty"}>{text}</strong>;
}

export function ContractPreview({
  data,
  highlight = false,
  freelancerSignature,
  clientSignature,
}: Props) {
  const fee = feePhrase(data);
  const extraRate =
    data.revisionRate === "" ? "Freelancer's standard hourly rate" : formatMoney(data.revisionRate);

  return (
    <article className="contract">
      <h1>Freelance Services Agreement</h1>
      <p>
        This Freelance Services Agreement (&quot;Agreement&quot;) is entered into as of{" "}
        <Term highlight={highlight} value={formatDate(data.effectiveDate, "")} fallback="Date" />{" "}
        (&quot;Effective Date&quot;), by and between:
      </p>

      <div className="parties">
        <div>
          <p>
            <strong>Freelancer:</strong>{" "}
            <Term highlight={highlight} value={data.freelancer.name} fallback="Name" />
          </p>
          <p>
            <strong>Email:</strong>{" "}
            <Term highlight={highlight} value={data.freelancer.email} fallback="Email" />
          </p>
          <p>
            <strong>Address:</strong>{" "}
            <Term highlight={highlight} value={data.freelancer.address} fallback="Address" />
          </p>
        </div>
        <div className="and">And</div>
        <div>
          <p>
            <strong>Client:</strong>{" "}
            <Term highlight={highlight} value={data.client.name} fallback="Name" />
          </p>
          <p>
            <strong>Email:</strong>{" "}
            <Term highlight={highlight} value={data.client.email} fallback="Email" />
          </p>
          <p>
            <strong>Address:</strong>{" "}
            <Term highlight={highlight} value={data.client.address} fallback="Address" />
          </p>
        </div>
      </div>

      <h2>1. Services &amp; Scope of Work</h2>
      <ul>
        <li>
          <strong>1.1 Scope:</strong> The Freelancer agrees to perform the professional services and
          deliver the work product described in Exhibit A attached hereto, or as outlined in an
          agreed-upon Statement of Work (SOW) (the &quot;Services&quot;).
        </li>
        <li>
          <strong>1.2 Work Arrangement:</strong>{" "}
          <Term highlight={highlight} value={locationPhrase(data)} /> {workStylePhrase(data)}
        </li>
        <li>
          <strong>1.3 Change Orders:</strong> Any modifications to the Scope of Work, deliverables,
          timelines, or budget must be agreed upon in writing by both parties via a Change Order
          prior to execution.
        </li>
      </ul>

      <h2>2. Compensation &amp; Payment Terms</h2>
      <ul>
        <li>
          <strong>2.1 Fees:</strong> Client agrees to compensate Freelancer according to{" "}
          <Term highlight={highlight} value={fee} /> as detailed in Exhibit A.
        </li>
        <li>
          <strong>2.2 Invoicing:</strong> <Term highlight={highlight} value={invoicePhrase(data)} />
        </li>
        <li>
          <strong>2.3 Payment Window:</strong> Invoices are due and payable within{" "}
          <Term highlight={highlight} value={`${data.invoiceDays}`} /> calendar days of receipt.
        </li>
        <li>
          <strong>2.4 Late Payments:</strong> Late payments shall accrue interest at a rate of{" "}
          <Term highlight={highlight} value={`${data.lateFeePercent}%`} /> per month (or the maximum
          allowed by law) on the outstanding balance until paid in full. Freelancer reserves the
          right to suspend performance of Services until all overdue invoices are settled.
        </li>
        <li>
          <strong>2.5 Reimbursable Expenses:</strong>{" "}
          {data.expensesReimbursable ? (
            <>
              Client shall reimburse Freelancer for reasonable pre-approved out-of-pocket expenses
              incurred directly in connection with the performance of the Services.
            </>
          ) : (
            <>
              Unless the parties agree otherwise in writing, Freelancer&apos;s fees include ordinary
              expenses of performing the Services.
            </>
          )}
        </li>
      </ul>

      <h2>3. Client Review &amp; Acceptance</h2>
      <ul>
        <li>
          <strong>3.1 Review Period:</strong> Client will have{" "}
          <Term highlight={highlight} value={`${data.reviewDays}`} /> business days after receipt of
          any deliverable to review and request revisions.
        </li>
        <li>
          <strong>3.2 Revisions:</strong> Freelancer includes up to{" "}
          <Term highlight={highlight} value={`${data.revisionRounds}`} /> round
          {data.revisionRounds === 1 ? "" : "s"} of reasonable revisions per deliverable. Requests
          for additional revisions outside the original scope will be billed at{" "}
          <Term highlight={highlight} value={extraRate} />.
        </li>
        <li>
          <strong>3.3 Deemed Acceptance:</strong> If Client does not provide written feedback or
          notice of rejection within the{" "}
          <Term highlight={highlight} value={`${data.reviewDays}-day`} /> review period, the
          deliverable will be deemed accepted.
        </li>
      </ul>

      <h2>4. Intellectual Property &amp; Ownership</h2>
      <ul>
        <li>
          <strong>4.1 Transfer of Rights:</strong> Upon full payment of all fees owed under this
          Agreement, Freelancer hereby assigns and transfers to Client all rights, title, and
          copyright in and to the final deliverables created specifically for Client under this
          Agreement.
        </li>
        <li>
          <strong>4.2 Pre-Existing &amp; Third-Party Materials:</strong> Freelancer retains full
          ownership of any pre-existing tools, templates, processes, or third-party assets utilized
          in creating the deliverables. Client is granted a non-exclusive, perpetual, royalty-free
          license to use such materials embedded in the final deliverables.
        </li>
        <li>
          <strong>4.3 Portfolio Rights:</strong>{" "}
          {data.portfolioRights ? (
            <>
              Freelancer retains the right to display, reference, and showcase the final
              deliverables and Client logo in Freelancer&apos;s portfolio, website, case studies,
              and promotional materials.
            </>
          ) : (
            <>
              Freelancer will not display the final deliverables or Client logo in portfolio or
              promotional materials without Client&apos;s prior written consent.
            </>
          )}
        </li>
      </ul>

      <h2>5. Independent Contractor Relationship</h2>
      <ul>
        <li>
          <strong>5.1 Status:</strong> Freelancer is an independent contractor, not an employee,
          partner, or joint venturer of Client.
        </li>
        <li>
          <strong>5.2 Taxes &amp; Benefits:</strong> Freelancer is solely responsible for paying all
          federal, state, and local taxes, insurance, and self-employment contributions. Freelancer
          is not eligible for any Client-provided employee benefits.
        </li>
      </ul>

      <h2>6. Confidentiality</h2>
      <ul>
        <li>
          <strong>6.1 Confidential Information:</strong> Each party agrees to protect and maintain
          as confidential all non-public, proprietary information disclosed by the other party
          during the engagement.
        </li>
        <li>
          <strong>6.2 Exclusions:</strong> Confidential Information does not include information
          that is publicly known through no breach of this Agreement, already known to the receiving
          party, or required to be disclosed by legal requirement.
        </li>
      </ul>

      <h2>7. Term &amp; Termination</h2>
      <ul>
        <li>
          <strong>7.1 Term:</strong> This Agreement begins on the Effective Date and continues until
          completion of the Services or until terminated by either party.
        </li>
        <li>
          <strong>7.2 Termination for Convenience:</strong> Either party may terminate this
          Agreement by giving{" "}
          <Term highlight={highlight} value={`${data.terminationDays}`} /> calendar days&apos;
          written notice to the other party.
        </li>
        <li>
          <strong>7.3 Termination for Breach:</strong> Either party may terminate immediately upon
          written notice if the other party breaches any material term of this Agreement and fails
          to cure such breach within{" "}
          <Term highlight={highlight} value={`${data.breachCureDays}`} /> days of receipt of written
          notice.
        </li>
        <li>
          <strong>7.4 Payment Upon Termination:</strong> In the event of termination, Freelancer
          shall be compensated for all work performed and non-cancellable expenses incurred up to
          the effective date of termination.
        </li>
      </ul>

      <h2>8. Limitation of Liability &amp; Warranties</h2>
      <ul>
        <li>
          <strong>8.1 Warranty:</strong> Freelancer warrants that Services will be performed in a
          professional, workmanlike manner according to standard industry practices.
        </li>
        <li>
          <strong>8.2 Limitation:</strong> To the maximum extent permitted by applicable law,
          Freelancer&apos;s aggregate liability under this Agreement shall not exceed the total fees
          paid by Client under this Agreement. In no event shall either party be liable for
          indirect, incidental, or consequential damages.
        </li>
      </ul>

      <h2>9. General Provisions</h2>
      <ul>
        <li>
          <strong>9.1 Governing Law:</strong> This Agreement shall be governed by and construed in
          accordance with the laws of the State of{" "}
          <Term highlight={highlight} value={slot(data.governingLaw, "California")} />.
        </li>
        <li>
          <strong>9.2 Entire Agreement:</strong> This Agreement constitutes the complete
          understanding between the parties and supersedes all prior proposals, negotiations, or
          agreements.
        </li>
        <li>
          <strong>9.3 Counterparts &amp; Signatures:</strong> This Agreement may be executed in
          counterparts and via electronic signature, each of which shall be deemed an original.
        </li>
      </ul>

      <h2>Signatures</h2>
      <div className="sigs">
        <SigBlock
          heading="Freelancer"
          title={data.freelancer.title || "Freelancer / Independent Contractor"}
          name={freelancerSignature?.name || data.freelancer.name}
          date={freelancerSignature?.signedAt}
          image={freelancerSignature?.dataUrl}
          highlight={highlight}
        />
        <SigBlock
          heading="Client"
          title={data.client.title || "Authorized Representative"}
          name={clientSignature?.name || data.client.name}
          date={clientSignature?.signedAt}
          image={clientSignature?.dataUrl}
          highlight={highlight}
        />
      </div>

      <h2>Exhibit A: Statement of Work (SOW)</h2>
      <ul>
        <li>
          <strong>Description of Services:</strong>{" "}
          <Term
            highlight={highlight}
            value={data.services}
            fallback="Detailed scope of work, deliverables, and specifications to be completed by Freelancer."
          />
        </li>
        <li>
          <strong>Project Rate / Fee Structure:</strong>{" "}
          <Term highlight={highlight} value={fee} />
        </li>
        <li>
          <strong>Payment Schedule:</strong>{" "}
          <Term highlight={highlight} value={scheduleLabel(data)} />
        </li>
        {data.milestones.trim() ? (
          <li>
            <strong>Milestones / notes:</strong>{" "}
            <Term highlight={highlight} value={data.milestones} />
          </li>
        ) : null}
        <li>
          <strong>Target Completion Date:</strong>{" "}
          <Term
            highlight={highlight}
            value={data.targetCompletion ? formatDate(data.targetCompletion, "") : ""}
            fallback="Date"
          />
        </li>
      </ul>
    </article>
  );
}

function SigBlock({
  heading,
  title,
  name,
  date,
  image,
  highlight,
}: {
  heading: string;
  title: string;
  name: string;
  date?: string | null;
  image?: string;
  highlight?: boolean;
}) {
  return (
    <div className="sig">
      <h2 style={{ marginTop: 0 }}>{heading}</h2>
      {image ? (
        // Signature drawings are user-created PNG data URLs, not remote images.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={`${heading} signature`} />
      ) : (
        <div className="line" />
      )}
      <dl>
        <dt>Name</dt>
        <dd>
          <Term highlight={highlight} value={name} fallback="Name" />
        </dd>
        <dt>Title</dt>
        <dd>{title}</dd>
        <dt>Date</dt>
        <dd>
          <Term highlight={highlight} value={date ? formatStamp(date) : ""} fallback="Date" />
        </dd>
      </dl>
    </div>
  );
}
