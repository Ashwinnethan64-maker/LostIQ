import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "#FFFDF5",
          surface: "#FFFFFF",
          muted: "#E2E8F0",
        },
        structure: {
          DEFAULT: "#000000",
          text: "#000000",
        },
        primary: {
          DEFAULT: "#FF6B6B", // Neo Coral Red
          hover: "#FF5252",
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#FFD93D", // Neo Cyber Yellow
          hover: "#FCC419",
          foreground: "#000000",
        },
        tertiary: {
          DEFAULT: "#C4B5FD", // Neo Electric Violet
          hover: "#A78BFA",
          foreground: "#000000",
        },
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
        grotesk: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
      },
      borderWidth: {
        3: "3px",
        4: "4px",
        6: "6px",
        8: "8px",
      },
      boxShadow: {
        "neo-sm": "4px 4px 0px #000000",
        "neo": "8px 8px 0px #000000",
        "neo-lg": "12px 12px 0px #000000",
        "neo-xl": "16px 16px 0px #000000",
      },
      animation: {
        "marquee": "marquee 25s linear infinite",
        "spin-slow": "spin 12s linear infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
