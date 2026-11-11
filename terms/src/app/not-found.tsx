import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export default function NotFound() {
  return (
    <main className="wrap" style={{ maxWidth: 640 }}>
      <Link className="brand" href="/" style={{ marginBottom: 24, display: "inline-flex" }}>
        <BrandMark />
        Terms
      </Link>
      <p className="kicker">Missing link</p>
      <h1>This agreement is not here.</h1>
      <p className="lede">The link may be wrong, or it was never created. Ask for a new one.</p>
      <Link className="pill on" href="/" style={{ display: "inline-block" }}>
        Make new terms
      </Link>
    </main>
  );
}
