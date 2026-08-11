import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16251e",
        pine: "#0c6b4e",
        mint: "#dff4e9",
        sand: "#f5f2e9",
        coral: "#e66b49"
      },
      boxShadow: { card: "0 12px 36px rgba(24, 52, 40, .08)" }
    }
  },
  plugins: []
} satisfies Config;
