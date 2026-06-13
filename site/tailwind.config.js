/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#11203A", // primary navy
        deep: "#0B1626", // near-black sections
        paper: "#F5F2EA", // warm paper
        brass: "#A9853F", // accent
        brassLight: "#C6A765",
        hairline: "#E4DECF",
        slate: "#5B6B82",
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        display: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      letterSpacing: { tightest: "-0.04em" },
      boxShadow: {
        lift: "0 30px 80px -30px rgba(11,22,38,0.45)",
        card: "0 20px 50px -24px rgba(11,22,38,0.30)",
      },
    },
  },
  plugins: [],
};
