"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";

const OPTIONS = [
  { key: "today", label: "Sot" },
  { key: "week", label: "Këtë Javë" },
  { key: "month", label: "Këtë Muaj" },
  { key: "year", label: "Këtë Vit" },
  { key: "custom", label: "Personalizuar" },
];

export default function PeriodSwitch({ period }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showCustom, setShowCustom] = useState(period === "custom");
  const [start, setStart] = useState(searchParams.get("start") || "");
  const [end, setEnd] = useState(searchParams.get("end") || "");

  function go(p) {
    if (p === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    router.push(`${pathname}?period=${p}`);
  }

  function applyCustom() {
    if (!start || !end) return;
    router.push(`${pathname}?period=custom&start=${start}&end=${end}`);
  }

  return (
    <div>
      <div className="period-switch">
        {OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={`period-btn ${period === opt.key ? "active" : ""}`}
            onClick={() => go(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className={`custom-range-row ${showCustom ? "visible" : ""}`}>
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <span>deri</span>
        <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        <button type="button" className="btn btn-primary btn-sm" onClick={applyCustom}>
          Apliko
        </button>
      </div>
    </div>
  );
}
