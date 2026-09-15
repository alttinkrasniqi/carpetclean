"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Paneli", icon: "▦" },
  { href: "/orders", label: "Porositë", icon: "📋" },
  { href: "/customers", label: "Klientët", icon: "👥" },
  { href: "/reports", label: "Raportet", icon: "📊" },
  { href: "/settings", label: "Cilësimet", icon: "⚙" },
];

export default function Sidebar({ businessName }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // close the mobile menu automatically whenever we navigate
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setOpen(true)} aria-label="Hap menynë">
        ☰
      </button>
      <div className={`sidebar-overlay ${open ? "visible" : ""}`} onClick={() => setOpen(false)} />

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">🧼</div>
          <div className="brand-name">{businessName}</div>
        </div>
        <nav className="nav">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={`nav-link ${isActive(link.href) ? "active" : ""}`}>
              <span className="nav-icon">{link.icon}</span> {link.label}
            </Link>
          ))}
        </nav>
        <Link href="/orders/new" className="btn btn-primary sidebar-cta">
          + Porosi e Re
        </Link>
      </aside>
    </>
  );
}
