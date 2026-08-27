import type { Config } from "tailwindcss";

const config: Config = {
  presets: [require("@yoi/design/tailwind.preset")],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", sm: "2rem" },
      screens: { "2xl": "1152px" },
    },
  },
};

export default config;
