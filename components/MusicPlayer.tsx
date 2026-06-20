"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Howl } from "howler";
import XPButtons from "./XPButtons";

type MusicTrack = {
  id: string;
  url: string;
  title: string;
  artist: string;
};

function formatTime(seconds: number) {
  if (!seconds || !isFinite(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function DesktopPlayer({
  tracks,
  currentTrack,
  setCurrentTrack,
  isPlaying,
  setIsPlaying,
  currentTime,
  setCurrentTime,
  duration,
  setDuration,
  volume,
  setVolume,
  started,
  setStarted,
  onTogglePlay,
  onStop,
  onSeek,
}: {
  tracks: MusicTrack[];
  currentTrack: number;
  setCurrentTrack: (n: number | ((p: number) => number)) => void;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  currentTime: number;
  setCurrentTime: (v: number) => void;
  duration: number;
  setDuration: (v: number) => void;
  volume: number;
  setVolume: (v: number) => void;
  started: boolean;
  setStarted: (v: boolean) => void;
  onTogglePlay: () => void;
  onStop: () => void;
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  const track = tracks[currentTrack];
  const trackLabel = track ? "STREAMING..." : "Loading tracks...";

  return (
    <div className="w-64 border border-[#333] bg-black">
      <div className="violet-header flex h-5 items-center justify-between px-1">
        <span className="font-pixel text-[7px] text-white">WINAMP 2.91</span>
        <XPButtons />
      </div>
      <div className="overflow-hidden bg-[#0a0a0a] p-1">
        <div className="overflow-hidden whitespace-nowrap">
          <span className="inline-block animate-marquee font-mono text-[10px] text-[#00ff00]">
            {trackLabel}
          </span>
        </div>
      </div>
      <div className="flex h-6 items-end justify-center gap-1 px-2 py-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="w-2 animate-eq-bar bg-[#00aa00]"
            style={{
              animationDuration: `${0.3 + (i % 3) * 0.15}s`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
      <div className="px-2 text-right font-mono text-[9px] text-[#00ff00]">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
      <div className="mx-2 h-1 cursor-pointer bg-[#333]" onClick={onSeek}>
        <div
          className="h-full bg-xp-violet-mid"
          style={{
            width: duration ? `${(currentTime / duration) * 100}%` : "0%",
          }}
        />
      </div>
      <div className="my-1 flex items-center justify-center gap-2 px-2">
        <button
          type="button"
          className="xp-button text-[9px]"
          onClick={() =>
            setCurrentTrack((prev) => (prev - 1 + tracks.length) % tracks.length)
          }
        >
          |◀
        </button>
        <button type="button" className="xp-button text-[9px]" onClick={onTogglePlay}>
          {isPlaying ? "⏸" : "▶"}
        </button>
        <button type="button" className="xp-button text-[9px]" onClick={onStop}>
          ■
        </button>
        <button
          type="button"
          className="xp-button text-[9px]"
          onClick={() =>
            setCurrentTrack((prev) => (prev + 1) % tracks.length)
          }
        >
          ▶|
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="ml-auto w-16"
        />
      </div>
    </div>
  );
}

export default function MusicPlayer({ mobile = false }: { mobile?: boolean }) {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1); // FIX: default 100%
  const [started, setStarted] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const howlRef = useRef<Howl | null>(null);
  const HowlClassRef = useRef<typeof import("howler").Howl | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wantPlayRef = useRef(false);
  const tracksRef = useRef(tracks);
  const currentTrackRef = useRef(currentTrack);
  // FIX: volume ref so loadTrack never depends on volume state
  const volumeRef = useRef(1);

  tracksRef.current = tracks;
  currentTrackRef.current = currentTrack;

  // FIX: keep volumeRef in sync with volume state
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    fetch("/api/music")
      .then((r) => r.json())
      .then((fetchedTracks) => {
        setTracks(fetchedTracks);
        if (fetchedTracks && fetchedTracks.length > 0) {
          const randomIndex = Math.floor(Math.random() * fetchedTracks.length);
          setCurrentTrack(randomIndex);
        }
      })
      .catch(() => setTracks([]));
  }, []);

  useEffect(() => {
    const initAudio = () => {
      if (started) return;
      import("howler").then(({ Howl }) => {
        HowlClassRef.current = Howl;
        setStarted(true);
      });
    };
    window.addEventListener("click", initAudio, { once: true });
    return () => window.removeEventListener("click", initAudio);
  }, [started]);

  // FIX: no volume in deps — uses volumeRef instead
  // This means volume changes NEVER trigger a track reload
  const loadTrack = useCallback((index: number, autoplay: boolean) => {
    if (!HowlClassRef.current || !tracksRef.current[index]) return;

    // FIX: always unload previous howl completely before creating new one
    if (howlRef.current) {
      howlRef.current.stop();
      howlRef.current.unload();
      howlRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setCurrentTime(0);
    setDuration(0);

    const Howl = HowlClassRef.current;
    const track = tracksRef.current[index];

    howlRef.current = new Howl({
      src: [track.url],
      html5: true,
      volume: volumeRef.current, // FIX: use ref not state
      onload: function (this: Howl) {
        setDuration(this.duration());
      },
      onplay: function (this: Howl) {
        setIsPlaying(true);
        timerRef.current = setInterval(() => {
          setCurrentTime(this.seek() as number);
        }, 250);
      },
      onpause: () => {
        setIsPlaying(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      },
      onstop: () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      },
      onend: () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        const next = (currentTrackRef.current + 1) % tracksRef.current.length;
        wantPlayRef.current = true;
        setCurrentTrack(next);
      },
    });

    if (autoplay) howlRef.current.play();
  }, []); // FIX: empty deps — never recreated, never triggers track reload

  // Only fires when track index changes or howler first becomes available
  useEffect(() => {
    if (started && tracks.length > 0) {
      loadTrack(currentTrack, wantPlayRef.current);
      wantPlayRef.current = false;
    }
  }, [currentTrack, started, tracks.length, loadTrack]);

  // FIX: volume change ONLY adjusts running howl volume — never reloads track
  useEffect(() => {
    if (howlRef.current) {
      howlRef.current.volume(volume);
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      howlRef.current?.stop();
      howlRef.current?.unload();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const ensureStarted = async () => {
    if (!HowlClassRef.current) {
      const { Howl } = await import("howler");
      HowlClassRef.current = Howl;
      setStarted(true);
    }
  };

  const togglePlay = async () => {
    await ensureStarted();
    wantPlayRef.current = true;
    if (!howlRef.current) {
      loadTrack(currentTrack, true);
      return;
    }
    if (isPlaying) howlRef.current.pause();
    else howlRef.current.play();
  };

  const stopTrack = () => {
    wantPlayRef.current = false;
    howlRef.current?.stop();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!howlRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    howlRef.current.seek(duration * pct);
    setCurrentTime(duration * pct);
  };

  const track = tracks[currentTrack];
  const trackLabel = track ? "STREAMING..." : "Loading tracks...";

  const playerProps = {
    tracks,
    currentTrack,
    setCurrentTrack,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    volume,
    setVolume,
    started,
    setStarted,
    onTogglePlay: togglePlay,
    onStop: stopTrack,
    onSeek: seek,
  };

  if (mobile) {
    return (
      <>
        <div className="flex items-center justify-between bg-black px-3 py-2">
          <span className="truncate font-mono text-[10px] text-[#00ff00]">
            {trackLabel}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="xp-button text-[10px]"
              onClick={togglePlay}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button
              type="button"
              className="xp-button text-[10px]"
              onClick={() => setExpanded(true)}
            >
              ⛶
            </button>
          </div>
        </div>
        {expanded && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 pb-20"
            onClick={() => setExpanded(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <DesktopPlayer {...playerProps} />
            </div>
          </div>
        )}
      </>
    );
  }

  return <DesktopPlayer {...playerProps} />;
}