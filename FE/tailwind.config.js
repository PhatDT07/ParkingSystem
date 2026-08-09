/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Material-3 tokens used by the admin monitoring surface (system-overview),
        // the manager dashboard and capacity KPI cards. Defined here so those
        // components render as designed instead of falling back to unstyled classes.
        surface: "#fdfcff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f6f8fb",
        "surface-container": "#f0f3f6",
        "surface-container-high": "#eaedf1",
        "on-surface": "#1a1c1e",
        "on-surface-variant": "#42474e",
        "on-background": "#1a1c1e",
        "on-primary": "#ffffff",
        outline: "#72777f",
        "outline-variant": "#c2c7cf",
        error: "#ba1a1a",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // M3 spacing scale (xs–xl) — additive to Tailwind's numeric scale.
      spacing: {
        xs: "0.25rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
      },
      // M3 type scale used by the same components (text-display, text-body-md, …).
      fontSize: {
        display: ["2.25rem", { lineHeight: "2.75rem" }],
        "headline-md": ["1.75rem", { lineHeight: "2.25rem" }],
        "body-lg": ["1rem", { lineHeight: "1.5rem" }],
        "body-md": ["0.875rem", { lineHeight: "1.25rem" }],
        "label-mono": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.05em" }],
      },
      // font-* utilities the components pair with the sizes above.
      fontFamily: {
        display: ["ui-sans-serif", "system-ui", "sans-serif"],
        "headline-md": ["ui-sans-serif", "system-ui", "sans-serif"],
        "body-lg": ["ui-sans-serif", "system-ui", "sans-serif"],
        "body-md": ["ui-sans-serif", "system-ui", "sans-serif"],
        "label-mono": ["ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
