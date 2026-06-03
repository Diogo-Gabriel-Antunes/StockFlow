import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "#d7dde5",
        ink: "#17202a",
        muted: "#64748b",
        panel: "#ffffff",
        page: "#f6f8fb",
        primary: "#0f766e",
        accent: "#b45309",
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
