"use client";

const pixels = [
  { left: "5%", size: 4, duration: 15, delay: 0 },
  { left: "12%", size: 6, duration: 18, delay: 1 },
  { left: "22%", size: 8, duration: 21, delay: 2 },
  { left: "35%", size: 4, duration: 24, delay: 3 },
  { left: "48%", size: 6, duration: 27, delay: 4 },
  { left: "58%", size: 8, duration: 30, delay: 5 },
  { left: "67%", size: 4, duration: 17, delay: 6 },
  { left: "74%", size: 6, duration: 20, delay: 7 },
  { left: "82%", size: 8, duration: 23, delay: 8 },
  { left: "88%", size: 4, duration: 26, delay: 9 },
  { left: "93%", size: 6, duration: 29, delay: 10 },
  { left: "97%", size: 8, duration: 16, delay: 12 },
];

const cursors = [
  { left: "20%", top: "30%", delay: "0s" },
  { left: "60%", top: "60%", delay: "0.7s" },
  { left: "80%", top: "25%", delay: "1.4s" },
];

export default function BackgroundPixels() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {pixels.map((p, i) => (
        <div
          key={i}
          className="absolute bottom-0 bg-xp-violet-light opacity-[0.08] animate-float-up"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      {cursors.map((c, i) => (
        <span
          key={i}
          className="absolute font-pixel text-[10px] text-xp-violet opacity-[0.12] animate-blink"
          style={{ left: c.left, top: c.top, animationDelay: c.delay }}
        >
          ▌
        </span>
      ))}
    </div>
  );
}
