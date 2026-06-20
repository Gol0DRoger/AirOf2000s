"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import XPButtons from "./XPButtons";

type Photo = { id: string; url: string };

export default function Slideshow({ photos }: { photos: Photo[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (photos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [photos.length]);

  if (photos.length === 0) {
    return (
      <div className="window-border mx-4 mt-4">
        <div className="violet-header flex items-center justify-between px-2 py-1">
          <span className="font-pixel text-[8px] text-white">camera_roll.exe</span>
          <XPButtons />
        </div>
        <div className="inset-border m-1 flex h-[56vw] items-center justify-center bg-xp-surface max-h-[480px] md:h-[400px]">
          <p className="font-body text-sm text-xp-muted">Loading photos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="window-border mx-4 mt-4 md:mx-16 lg:mx-48">
      <div className="violet-header flex items-center justify-between px-2 py-1">
        <span className="font-pixel text-[8px] text-white">camera_roll.exe</span>
        <XPButtons />
      </div>
      <div className="relative m-1 h-[56vw] overflow-hidden max-h-[480px] md:h-[400px]">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={photo.url}
              alt=""
              fill
              className={`object-cover ${
                index % 2 === 0 ? "animate-kenburns-1" : "animate-kenburns-2"
              }`}
              priority={index === 0}
              sizes="100vw"
              style={{ filter: 'sepia(0.2) brightness(0.9) contrast(1) saturate(0.8)' }}
            />
          </div>
        ))}
        <div className="grain-overlay opacity-10" />
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              "repeating-linear-gradient(transparent 0px, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
          }}
        />
        <div className="absolute bottom-3 right-3 z-20 rounded-full bg-black/50 px-2 py-1 font-pixel text-[9px] text-white">
          {currentIndex + 1} / {photos.length}
        </div>
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 w-1.5 rounded-full ${
                i === currentIndex ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
