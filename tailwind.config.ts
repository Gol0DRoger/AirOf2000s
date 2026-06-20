import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "xp-violet": "#522587",
        "xp-violet-dark": "#2d1b69",
        "xp-violet-mid": "#6b3fa0",
        "xp-violet-light": "#dab9ff",
        "xp-blue-title": "#0a246a",
        "xp-blue-end": "#a6c8f0",
        "xp-bg": "#f7f9ff",
        "xp-surface": "#ffffff",
        "xp-green-screen": "#889977",
        "xp-notepad": "#ffffe0",
        "xp-text": "#111d28",
        "xp-muted": "#4b4451",
      },
      fontFamily: {
        pixel: ["var(--font-pixel)", "'Press Start 2P'", "monospace"],
        mono: ["var(--font-mono)", "'Space Mono'", "monospace"],
        body: ["Tahoma", "Verdana", "Georgia", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
