import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        "primary-dark": "var(--primary-dark)",
        secondary: "var(--secondary)",
        accent: "var(--accent)",
        surface: "var(--surface)",
        "surface-light": "var(--surface-light)",
        "surface-lighter": "var(--surface-lighter)",
        border: "var(--border)",
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        "glass-bg": "var(--glass-bg)",
        "glass-border": "var(--glass-border)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "10px",
        xl: "20px",
      },
      boxShadow: {
        glow: "0 0 20px rgba(100, 181, 246, 0.3)",
        "glow-lg": "0 0 40px rgba(100, 181, 246, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
