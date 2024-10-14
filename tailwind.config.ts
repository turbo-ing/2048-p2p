import type { Config } from "tailwindcss";

import { nextui } from "@nextui-org/theme";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      keyframes: {
        fadeOut: {
          "0%": { transform: "translateY(0)", opacity: "0.9" },
          "100%": { transform: "translateY(-50px)", opacity: "0" },
        },
        newTileAppear: {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        mergeTile: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.2)", opacity: "0.8" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        fadeOut: "fadeOut 1s ease-out forwards",
        newTileAppear: "newTileAppear 0.3s ease",
        mergeTile: "mergeTile 0.3s ease",
      },
    },
  },
  darkMode: "class",
  plugins: [nextui()],
};

export default config;
