import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./src/components/**/*.{ts,tsx,js,jsx}",
    "./pages/**/*.{ts,tsx,js,jsx}",
  ],
   theme: {
    extend: {
      colors: {
        brand: {
          dark: "#052E16",      // Brand deep green
          blue: "#166534",      // Brand primary green
          teal: "#B45309",      // Brand amber accent
          gray: "#F4F7FB",      // Soft neutral background
          light: "#FAFBFC"      // Lighter section background
        }
      }
    }
  },
  plugins: [],
};

export default config;

