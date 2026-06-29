import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular"]
      },
      colors: {
        ink: "#0A0D12",
        panel: "#10151D",
        panel2: "#151B25",
        line: "rgba(255,255,255,.09)",
        muted: "#8F99A8",
        mint: "#34E0A1",
        violet: "#9D8BFF",
        rose: "#FF7A85",
        amber: "#F4C25A"
      }
    }
  },
  plugins: []
};

export default config;
