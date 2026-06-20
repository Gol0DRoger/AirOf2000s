"use client";

import { useEffect, useState } from "react";
import XPButtons from "./XPButtons";

type Cards = {
  WORLD: string;
  HOLLYWOOD: string;
  BOLLYWOOD: string;
  MUSIC: string;
  GAMING: string;
};

const categories = [
  { key: "WORLD" as const, icon: "🌍", label: "WORLD" },
  { key: "HOLLYWOOD" as const, icon: "🎥", label: "HOLLYWOOD" },
  { key: "BOLLYWOOD" as const, icon: "🎬", label: "BOLLYWOOD" },
  { key: "MUSIC" as const, icon: "🎵", label: "MUSIC" },
  { key: "GAMING" as const, icon: "🎮", label: "GAMING" },
];

function formatDisplayDate(dateStr: string) {
  const [dd, mm, yyyy] = dateStr.split("/");
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const monthName = months[parseInt(mm, 10) - 1] || "June";
  return `${monthName} ${parseInt(dd, 10)}, ${yyyy}`;
}

// FIX: use local date not UTC — IST midnight was returning yesterday's UTC date
function getLocalDateKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, "0");
  const dd   = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function TimeCapsule() {
  const [cards, setCards] = useState<Cards | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // FIX: local date key instead of UTC
    const today    = getLocalDateKey();
    const cacheKey = `timecapsule_${today}`;

    // Clear all old day cache keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith("timecapsule_") && key !== cacheKey) {
        localStorage.removeItem(key);
      }
    });

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        setCards(data.cards);
        setYear(data.year);
        setDate(data.date);
        setLoading(false);
        return;
      } catch {
        // Corrupted cache — clear it and refetch
        localStorage.removeItem(cacheKey);
      }
    }

    fetch("/api/timecapsule")
      .then((r) => r.json())
      .then((data) => {
        setCards(data.cards);
        setYear(data.year);
        setDate(data.date);
        localStorage.setItem(cacheKey, JSON.stringify(data));
      })
      .catch(() => {
        const y = new Date().getFullYear() - 20;
        setYear(y);
        setDate("");
        setCards(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div id="time-capsule-card" className="window-border bg-xp-violet-dark select-none">
      <div className="violet-header flex items-center justify-between px-2 py-1">
        <span className="font-pixel text-[9px] text-white">time_capsule.exe</span>
        <XPButtons />
      </div>
      <div className="bg-xp-violet-dark p-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-white/10" />
            ))}
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="font-pixel text-[8px] uppercase tracking-[0.2em] text-xp-violet-light">
                  TIME CAPSULE
                </p>
                <p className="mt-1 font-pixel text-xl text-white">
                  {date ? formatDisplayDate(date) : `Year ${year}`}
                </p>
              </div>
            </div>

            {categories.map(({ key, icon, label }) => (
              <div
                key={key}
                className="flex items-start gap-3 border-b border-white/10 py-3"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-lg">
                  {icon}
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-xp-violet-light">
                    {label}
                  </p>
                  <p className="mt-0.5 font-mono text-[12px] leading-relaxed text-white/90">
                    {cards?.[key] || "Loading memory..."}
                  </p>
                </div>
              </div>
            ))}

            <div className="mt-4 flex items-center justify-between">
              <span className="font-pixel text-[8px] text-xp-violet-light uppercase tracking-wide">
                Present From Past
              </span>
              <button
                type="button"
                className="xp-button border border-xp-violet-mid text-[10px] px-3 py-1 bg-[#ece9d8] text-black transition-all"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                }}
              >
                Copy Link
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}