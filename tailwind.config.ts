import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ivory: "#f6f5f0",
        ink: "#0f0f10",
        pine: "#18382f",
        mist: "#d8ddd6",
        sand: "#ece8dc"
      },
      boxShadow: {
        soft: "0 20px 60px rgba(15, 15, 16, 0.08)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"]
      },
      backgroundImage: {
        grain:
          "radial-gradient(circle at top, rgba(24,56,47,0.08), transparent 30%), linear-gradient(135deg, rgba(255,255,255,0.9), rgba(236,232,220,0.8))"
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseSoft: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.08)", opacity: "0.88" }
        }
      },
      animation: {
        rise: "rise 0.7s ease-out forwards",
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
