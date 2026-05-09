import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)"],
        display: ["var(--font-display)"],
      },
      colors: {
        primary: {
          DEFAULT: "#007bff",
          hover: "#0056b3",
        },
        success: "#28A745",
        danger: "#DC3545",
        warning: "#f5b454",
        accent: "#FF6B6B",
      },
    },
  },
  plugins: [],
};

export default config;
