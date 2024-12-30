import type { Config } from "tailwindcss";

import { nextui } from "@nextui-org/theme";

export const BASE_ANIMATION_SPEED = 0.25;

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
        // Animation sequences for tile transitions used in visual effects.
        // Both merge and new animations are set by base animation speed, but delay the start
        // of their animations by half of the animation speed allowing tile transform/movement
        // animation to complete without visual conflicts.
        newTile: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "50%": { transform: "scale(0)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        mergeTile: {
          "0%": { transform: "scale(1)", opacity: "0" },
          "45%": { transform: "scale(1)", opacity: "0" },
          "46%": { transform: "scale(1.2)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        fadeOut: "fadeOut 1s ease-out forwards",
        newTile: `newTile ${BASE_ANIMATION_SPEED * 2}s ease`,
        mergeTile: `mergeTile ${BASE_ANIMATION_SPEED * 2}s ease`,
      },
    },
  },
  darkMode: "class",
  plugins: [nextui()],
};

export default config;
