"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(null);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults(data);
      setOpen(true);
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div className="search-wrap" ref={boxRef}>
      <input
        type="text"
        placeholder="Kërko klient, telefon, ID porosie, adresë..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results && setOpen(true)}
        autoComplete="off"
      />
      <div className={`search-results ${open && results ? "" : "hidden"}`}>
        {results && results.length === 0 && <div className="search-empty">Nuk u gjet asnjë porosi përkatëse</div>}
        {results &&
          results.map((item) => (
            <div
              key={item.id}
              className="search-result-item"
              onClick={() => {
                setOpen(false);
                router.push(item.url);
              }}
            >
              <div className="sr-title">{item.title}</div>
              <div className="sr-subtitle">{item.subtitle}</div>
            </div>
          ))}
      </div>
    </div>
  );
}
