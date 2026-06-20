"use client";

import { useEffect, useState } from "react";
import XPButtons from "./XPButtons";

export default function LoadingScreen() {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const loaded = sessionStorage.getItem("xp_loaded");
    if (loaded) return;

    setVisible(true);
    const timer = setTimeout(() => {
      sessionStorage.setItem("xp_loaded", "1");
      setFadeOut(true);
      setTimeout(() => setVisible(false), 500);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#008080] transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="window-border w-[380px] max-w-[90vw] bg-[#ece9d8]">
        <div className="violet-header flex items-center justify-between px-2 py-1">
          <span className="font-pixel text-[8px] text-white">Windows XP</span>
          <XPButtons />
        </div>
        <div className="inset-border m-1 bg-[#ece9d8] p-6">
          <div className="font-pixel text-sm text-xp-violet">Windows XP</div>
          <div className="font-body text-[10px] text-xp-muted">Professional</div>
          <div className="my-3 h-px bg-[#888]" />
          <p className="font-pixel mb-4 text-[9px] text-xp-violet">
            Loading memories...
          </p>
          <div className="inset-border h-5 w-full overflow-hidden bg-[#c0c0c0]">
            <div className="flex h-full animate-xpload gap-1">
              <div className="h-full w-1/5 bg-[#2244cc]" />
              <div className="h-full w-1/5 bg-[#2244cc]" />
              <div className="h-full w-1/5 bg-[#2244cc]" />
            </div>
          </div>
          <p className="font-body mt-3 text-[10px] text-xp-muted">
            Please wait...
          </p>
        </div>
      </div>
    </div>
  );
}
