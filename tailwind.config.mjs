import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte,mdx}",
    "./pages/**/*.{astro,html,js,jsx,ts,tsx}",
    "./components/**/*.{astro,html,js,jsx,ts,tsx}",
    "./layouts/**/*.{astro,html,js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      /* ── shadcn/ui tokens (sin modificar) ── */
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        /* Radios custom del hostal */
        "hostal-sm": "10px",
        "hostal-md": "16px",
        "hostal-lg": "24px",
        "hostal-xl": "32px",
      },
      colors: {
        /* shadcn/ui (sin modificar) */
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },

        /* ── Colores custom Hostal El Monchito ── */
        forest:  "var(--forest)",
        moss:    "var(--moss)",
        sage:    "var(--sage)",
        fern:    "var(--fern)",
        fern2:   "var(--fern2)",
        glacier: "var(--glacier)",
        ice:     "var(--ice)",
        mist:    "var(--mist)",
        cloud:   "var(--cloud)",
        snow:    "var(--snow)",
        ink:     "var(--ink)",
        inkdeep: "var(--inkdeep)",
        inkbase: "var(--inkbase)",
        "col-footer": "var(--col-footer)",
        wa:      "var(--wa)",
      },

      /* ── Fuentes ── */
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        sans:  ["DM Sans", "system-ui", "sans-serif"],
      },

      /* ── Sombras ── */
      boxShadow: {
        "hostal-sm":   "0 2px 12px rgba(0,0,0,.35), 0 1px 3px rgba(0,0,0,.2)",
        "hostal-md":   "0 8px 32px rgba(0,0,0,.45), 0 2px 8px rgba(0,0,0,.25)",
        "hostal-lg":   "0 20px 60px rgba(0,0,0,.55), 0 4px 16px rgba(0,0,0,.3)",
        "hostal-fern": "0 8px 32px rgba(107,143,94,.18), 0 2px 8px rgba(107,143,94,.1)",
        "hostal-glow": "0 0 40px rgba(107,143,94,.12)",
        "wa-idle":     "0 4px 24px rgba(37,211,102,.45)",
        "wa-hover":    "0 8px 32px rgba(37,211,102,.55)",
        "fern-hover":  "0 12px 36px rgba(107,143,94,.3)",
        "card-hover":  "0 24px 64px rgba(0,0,0,.45), 0 8px 20px rgba(0,0,0,.25)",
      },

      /* ── Espaciado extra ── */
      minHeight: {
        "620": "620px",
      },

      /* ── Transiciones ── */
      transitionTimingFunction: {
        "ease-hostal": "cubic-bezier(.16,1,.3,1)",
      },
      transitionDuration: {
        "850": "850ms",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;