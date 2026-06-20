"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import XPButtons from "./XPButtons";

export default function WhoIsHere() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const channel = supabase.channel("visitors", {
      config: { presence: { key: Math.random().toString(36).slice(2) } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="window-border bg-xp-surface">
      <div className="violet-header flex items-center justify-between px-2 py-1">
        <span className="font-pixel text-[9px] text-white">Community Status</span>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse-green" />
          <XPButtons />
        </div>
      </div>
      <div className="inset-border m-1 flex flex-col items-center justify-center gap-2 p-6">
        <p className="animate-pulse font-pixel text-[52px] text-xp-violet">
          {count}
        </p>
        <p className="text-center font-body text-xs text-xp-muted">
          people breathing 2000s air right now
        </p>
        <p className="font-mono text-[9px] text-xp-muted/60">updated live</p>
      </div>
    </div>
  );
}
