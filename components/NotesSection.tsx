"use client";

import { useEffect, useState } from "react";
import XPButtons from "./XPButtons";

type Note = { content: string; created_at: string };
type Winner = {
  theme?: string;
  month_year?: string;
  note_content?: string;
  content?: string;
};

const noteColors = ["bg-yellow-100", "bg-blue-100", "bg-pink-100"];
const noteRotations = ["-rotate-2", "rotate-1", "-rotate-1"];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotesSection() {
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [winner, setWinner] = useState<Winner | null>(null);
  const [isLastDay, setIsLastDay] = useState(false);

  const loadNotes = () => {
    fetch("/api/notes")
      .then((r) => r.json())
      .then((data) => {
        setRecentNotes(data.recentNotes || []);
        setWinner(data.winner || null);
        setIsLastDay(data.isLastDay || false);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleChange = (value: string) => {
    setContent(value);
    setWordCount(value.split(/\s+/).filter(Boolean).length);
    setSubmitted(false);
    setError("");
  };

  const handlePost = async () => {
    if (wordCount > 120 || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not post");
        return;
      }
      setSubmitted(true);
      setContent("");
      setWordCount(0);
      loadNotes();
    } catch {
      setError("Could not post");
    } finally {
      setSubmitting(false);
    }
  };

  const winnerTheme =
    winner?.theme || winner?.content || "Memory of the Month";
  const quoteNotes = recentNotes.slice(0, 3);

  return (
    <div className="window-border">
      <div className="violet-header flex items-center justify-between px-2 py-1">
        <span className="font-pixel text-[9px] text-white">
          📌 Scrapbook Notes.exe
        </span>
        <XPButtons />
      </div>
      <div className="inset-border m-1 bg-xp-notepad p-4">
        {isLastDay && winner && (
          <div className="relative mb-4 overflow-hidden window-border">
            <div className="violet-header px-2 py-1">
              <span className="font-pixel text-sm text-white">
                MEMORY OF THE MONTH 🎊
              </span>
            </div>
            <div className="relative p-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="pointer-events-none absolute h-2 w-2 animate-confetti-fall"
                  style={{
                    left: `${Math.random() * 100}%`,
                    backgroundColor: [
                      "#ff0",
                      "#f0f",
                      "#0ff",
                      "#f00",
                      "#0f0",
                    ][i % 5],
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                />
              ))}
              <p className="font-pixel text-sm text-xp-violet-dark">
                {winnerTheme}
              </p>
              <div className="mt-3 space-y-2">
                {quoteNotes.map((note, i) => (
                  <p
                    key={i}
                    className="rounded border border-xp-muted/20 bg-white/50 p-2 text-center text-xs italic text-xp-text"
                  >
                    &ldquo;{note.content}&rdquo;
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        <textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Leave a scrap... (max 120 words) What is the one feeling from those years you lost when the world went always-online? Write something you miss about the 2000s"
          className="h-28 w-full resize-none border-none bg-transparent font-body text-sm text-xp-text outline-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(transparent, transparent 23px, #ccc 24px)",
            backgroundSize: "100% 24px",
            lineHeight: "24px",
          }}
        />

        <div className="mt-2 flex items-center justify-between">
          <span
            className={`font-mono text-[10px] ${
              wordCount > 120 ? "text-red-500" : "text-xp-muted"
            }`}
          >
            {wordCount}/120
          </span>
          <button
            type="button"
            className="xp-button disabled:opacity-50"
            disabled={wordCount > 120 || submitting || wordCount === 0}
            onClick={handlePost}
          >
            Post
          </button>
        </div>

        {submitted && (
          <p className="mt-2 text-sm text-green-600">
            ✓ Scrap posted! Come back tomorrow.
          </p>
        )}
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4">
          {recentNotes.map((note, i) => (
            <div
              key={`${note.created_at}-${i}`}
              className={`relative window-border p-2 md:p-3 shadow-md ${noteColors[i % 3]} ${noteRotations[i % 3]}`}
            >
              <div className="absolute left-1/2 top-1 h-2 w-2 md:h-3 md:w-3 -translate-x-1/2 rounded-full bg-red-500" />
              <p className="mt-2 text-center font-body text-xs md:text-sm italic text-xp-text">
                {note.content}
              </p>
              <p className="mt-2 text-center text-[8px] md:text-[9px] text-xp-muted">
                Anonymous · {timeAgo(note.created_at)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
