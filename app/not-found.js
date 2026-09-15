import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty-state">
      <div className="empty-state-title">Nuk u gjet</div>
      <p>Kjo faqe ose porosi nuk ekziston.</p>
      <Link href="/" className="btn btn-primary" style={{ marginTop: 12 }}>
        Kthehu te Paneli
      </Link>
    </div>
  );
}
