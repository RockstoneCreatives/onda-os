import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        onda: {
          primary: "#1e1b4b",
          accent: "#d97706",
          secondary: "#f5e6e8",
          50: "#fafaf9",
          100: "#f5f3f0",
          200: "#ede9e6",
          300: "#d4cfc9",
          400: "#9ca39c",
          500: "#6b7280",
          600: "#4b5563",
          700: "#2d3748",
          800: "#1f2937",
          900: "#111827",
        },
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        "gray-900": "var(--ds-gray-900)",
        "gray-1000": "var(--ds-gray-1000)",
        "gray-100": "var(--ds-gray-100)",
        "gray-alpha-400": "var(--ds-gray-alpha-400)",
        "background-100": "var(--ds-background-100)",
        "background-200": "var(--ds-background-200)",
      },
      fontFamily: {
        sans: ['"Inter"', "sans-serif"],
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(30, 27, 75, 0.05)",
        sm: "0 1px 3px 0 rgba(30, 27, 75, 0.1), 0 1px 2px 0 rgba(30, 27, 75, 0.06)",
        md: "0 4px 6px -1px rgba(30, 27, 75, 0.1), 0 2px 4px -1px rgba(30, 27, 75, 0.06)",
        lg: "0 10px 15px -3px rgba(30, 27, 75, 0.1), 0 4px 6px -2px rgba(30, 27, 75, 0.05)",
        xl: "0 20px 25px -5px rgba(30, 27, 75, 0.1), 0 10px 10px -5px rgba(30, 27, 75, 0.04)",
      },
      keyframes: {
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-out": "fade-out 0.3s ease-in-out",
        "fade-in": "fade-in 0.3s ease-in-out",
        "slide-up": "slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
