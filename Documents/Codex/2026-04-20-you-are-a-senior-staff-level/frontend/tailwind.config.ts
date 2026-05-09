import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#050816",
        surface: "#0d1326",
        surfaceAlt: "#12182f",
        accent: "#59d0ff",
        accentWarm: "#8b5cf6",
        danger: "#ff6b6b",
        border: "rgba(255,255,255,0.08)"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(96,165,250,0.16), 0 20px 60px rgba(6,8,17,0.48)"
      },
      fontFamily: {
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(56,189,248,0.2), transparent 28%), radial-gradient(circle at top right, rgba(139,92,246,0.18), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0))"
      }
    }
  },
  plugins: []
};

export default config;
