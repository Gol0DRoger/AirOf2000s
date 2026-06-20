"use client";

import { useState } from "react";

export default function SubmitMemory() {
  const [file, setFile] = useState<File | null>(null);
  const [year, setYear] = useState("");
  const [location, setLocation] = useState("");
  const [isOwnPhoto, setIsOwnPhoto] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setStatus({ type: "error", message: "Please select a photo" });
      return;
    }
    
    if (!year) {
      setStatus({ type: "error", message: "Please select the year" });
      return;
    }
    
    if (!isOwnPhoto) {
      setStatus({ type: "error", message: "Please confirm this is your own photo" });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("year", year);
    formData.append("location", location);

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setStatus({ 
          type: "success", 
          message: "Your memory has been received. If it fits, it will appear in the slideshow within a week." 
        });
        setFile(null);
        setYear("");
        setLocation("");
        setIsOwnPhoto(false);
      } else {
        setStatus({ type: "error", message: data.error || "Submission failed" });
      }
    } catch (error) {
      setStatus({ type: "error", message: "Network error. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-xp-bg p-4">
      <div className="mx-auto max-w-2xl">
        <div className="window-border">
          <div className="violet-header flex items-center justify-between px-2 py-1">
            <span className="font-pixel text-[8px] text-white">submit_memory.exe</span>
          </div>
          <div className="inset-border m-1 bg-xp-surface p-6">
            <h1 className="font-pixel text-xl text-xp-violet">
              SUBMIT YOUR 2000s MEMORY
            </h1>
            <p className="mt-2 font-body text-sm text-xp-muted">
             Shot between 2001–2010? Add it to the collection.<br/> Note: No personal portraits or family close-ups. Keep it general—landscapes, old street views, vintage technology, or rooms.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="font-body text-xs text-xp-text">
                  Your photo
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="inset-border mt-1 w-full bg-white px-3 py-2 font-body text-xs"
                  disabled={isSubmitting}
                />
                <p className="mt-1 font-mono text-[9px] text-xp-muted">
                  JPG, PNG, or WebP (max 5MB)
                </p>
              </div>

              <div>
                <label className="font-body text-xs text-xp-text">
                  Year taken
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="inset-border mt-1 w-full bg-white px-3 py-2 font-body text-xs"
                  disabled={isSubmitting}
                >
                  <option value="">Select year</option>
                  {Array.from({ length: 10 }, (_, i) => 2001 + i).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-body text-xs text-xp-text">
                  Where was this? (optional)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value.slice(0, 40))}
                  maxLength={40}
                  placeholder="e.g., New Delhi, Mumbai School"
                  className="inset-border mt-1 w-full bg-white px-3 py-2 font-body text-xs"
                  disabled={isSubmitting}
                />
                <p className="mt-1 font-mono text-[9px] text-xp-muted">
                  {location.length}/40 characters
                </p>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="own-photo"
                  checked={isOwnPhoto}
                  onChange={(e) => setIsOwnPhoto(e.target.checked)}
                  className="mt-1"
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="own-photo"
                  className="font-body text-xs text-xp-text"
                >
                  This is my own photo. Not downloaded. Not copyrighted.
                </label>
              </div>

              <div
                className="border border-[#808080] bg-[#ece9d8] shadow-[inset_1px_1px_0px_#fff] p-4"
              >
                {status && (
                  <p
                    className={`font-pixel text-[9px] mb-3 ${
                      status.type === "success" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {status.message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="xp-button w-full"
                >
                  {isSubmitting ? "Sending..." : "Send Memory →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
