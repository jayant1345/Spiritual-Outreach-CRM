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
        morpankh: {
          50: "#f0f8fa",
          100: "#d9eef3",
          200: "#b5dde7",
          300: "#83c4d6",
          400: "#49a3bf",
          500: "#028090",
          600: "#0b4f6c",
          700: "#08415c",
          800: "#063147",
          900: "#042333",
          950: "#021622",
        },
        gold: {
          50: "#fdfbf5",
          100: "#faf4e6",
          200: "#f4e7c8",
          300: "#ebd49f",
          400: "#e0bd70",
          500: "#d4af37",
          600: "#c59b27",
          700: "#a37a1c",
          800: "#84601b",
          900: "#6e4f1a",
          border: "#E5D8B8",
        },
        emerald: {
          seva: "#00A896",
          light: "#E6F6F4",
        },
        sandalwood: {
          canvas: "#FAF8F5",
          surface: "#FFFFFF",
          muted: "#F5F1EB",
          card: "#FFFFFF",
          stroke: "#E2D9C8",
        },
        charcoal: {
          DEFAULT: "#0B192C",
          muted: "#37474F",
          subtle: "#78909C",
        },
        saffron: {
          DEFAULT: "#D9480F",
          hover: "#BF3E0B",
          wash: "#FDF2EC",
        }
      },
      fontFamily: {
        serif: ["EB Garamond", "serif", "system-ui"],
        sans: ["Outfit", "Plus Jakarta Sans", "Inter", "sans-serif"],
      },
      boxShadow: {
        gold: "0 4px 20px -2px rgba(11, 25, 44, 0.04), 0 2px 6px -1px rgba(197, 155, 39, 0.08)",
        "gold-lg": "0 12px 32px -4px rgba(11, 25, 44, 0.08), 0 4px 12px -2px rgba(197, 155, 39, 0.14)",
      }
    },
  },
  plugins: [],
};
export default config;
