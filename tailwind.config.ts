import type { Config } from "tailwindcss";

// Colours point at the tokens in app/globals.css.
const brand = (step: number) => `rgb(var(--brand-${step}) / <alpha-value>)`;

export default {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        brand: {
          DEFAULT: brand(600),
          50: brand(50),
          100: brand(100),
          200: brand(200),
          400: brand(400),
          500: brand(500),
          600: brand(600),
          700: brand(700),
          900: brand(900),
          // Older names still used by a few components.
          light: brand(500),
          dark: brand(900),
        },
        accent: {
          DEFAULT: brand(500),
          light: brand(100),
        },
        heading: "var(--text-heading)",
        "grid-border": "#e5e5e5",
      },
      maxWidth: { "grid-width": "1080px" },
      width: { "grid-width": "1080px" },
      keyframes: {
        "slide-up-fade": {
          "0%": { opacity: "0", transform: "translateY(var(--offset, 10px))" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "slide-up-fade": "slide-up-fade 1s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.2s ease-out forwards",
      },
    },
  },
  future: { hoverOnlyWhenSupported: true },
  plugins: [],
} satisfies Config;
