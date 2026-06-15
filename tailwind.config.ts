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
          accent: "#f73913",
          surface: "#f5f5f5",
          border: "#e5e5e5",
          text: "#1a1a1a",
          muted: "#6b6b6b",
        },
      },
      fontFamily: {
        condensed: ['"Barlow Condensed"', "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
