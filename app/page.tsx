import { getDailyPhotos } from "@/lib/cloudinary";
import Slideshow from "@/components/Slideshow";
import MusicPlayer from "@/components/MusicPlayer";
import TimeCapsule from "@/components/TimeCapsule";
import WhoIsHere from "@/components/WhoIsHere";
import NotesSection from "@/components/NotesSection";
import SnakeGameClient from "@/components/SnakeGameClient";

export const revalidate = 86400;

export default async function Home() {
  let photos: { id: string; url: string }[] = [];
  try {
    photos = await getDailyPhotos();
  } catch {
    photos = [];
  }

  return (
    <main className="min-h-screen bg-xp-bg">
      <header className="sticky top-0 z-40 hidden h-8 items-center justify-between bg-xp-violet-dark px-4 md:flex">
        <div className="font-pixel text-[8px] text-white">AIR OF 2000s</div>
        <nav className="flex gap-6">
          {["Home", "Time Capsule", "Notes", "Who's Here"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s/g, "-").replace("'s", "s")}`}
              className="font-body text-[11px] text-white/80 transition-colors hover:text-white hover:underline"
            >
              {item}
            </a>
          ))}
          <a
            href="/submit"
            className="font-body text-[11px] text-white/80 transition-colors hover:text-white hover:underline"
          >
            Submit
          </a>
        </nav>
      </header>

      <section id="home" className="relative">
        <Slideshow photos={photos} />
        <div className="absolute bottom-12 right-4 z-30 hidden md:block">
          <MusicPlayer />
        </div>
      </section>

      <div className="mt-4 space-y-4 px-4 pb-4 md:px-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2" id="time-capsule">
            <TimeCapsule />
          </div>
          <div id="whos-here">
            <WhoIsHere />
          </div>
        </div>

        <section id="notes">
          <NotesSection />
        </section>
      </div>

      <footer className="mt-8 bg-[#1a1a1a] py-4 pb-20 md:pb-4">
        <div className="flex flex-col items-center justify-between gap-4 px-8 md:flex-row">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-orange-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L4 20h16L12 2zm-1 13v-4h2v4h-2zm0 3h2v2h-2v-2z" />
            </svg>
            <span className="font-pixel text-[8px] text-gray-400">
              AIR OF 2000s
            </span>
          </div>
         <nav className="flex gap-4">
  
    <a href="/submit"
    className="xp-button border border-xp-violet-mid bg-[#ece9d8] px-3 py-1 text-[10px] text-xp-violet-dark font-pixel hover:bg-[#dedacb] transition-colors"
  >
    Submit a Memory →
  </a>
</nav>
          <div className="border border-gray-600 bg-black/50 p-1">
            <span className="font-mono text-[9px] text-gray-500">
              Best viewed in Internet Explorer 6.0 at 800×600
            </span>
          </div>
        </div>
      </footer>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-center justify-around border-t border-xp-violet-mid bg-xp-violet-dark md:hidden">
        {[
          { label: "Home", icon: "🪟", href: "#home" },
          { label: "Capsule", icon: "⏰", href: "#time-capsule" },
          { label: "Notes", icon: "📝", href: "#notes" },
          { label: "Submit", icon: "📷", href: "/submit" },
        ].map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex flex-col items-center gap-0.5 text-white/70 transition-colors hover:text-white"
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-pixel text-[7px]">{item.label}</span>
          </a>
        ))}
      </nav>

      <div
        id="player"
        className="fixed bottom-14 left-0 right-0 z-30 md:hidden"
      >
        <MusicPlayer mobile />
      </div>

      <SnakeGameClient />
    </main>
  );
}
