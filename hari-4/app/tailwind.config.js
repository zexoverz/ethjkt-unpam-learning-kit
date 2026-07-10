/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#09090B',
          card: '#18181B',
          border: '#27272A',
          text: '#FAFAFA',
          muted: '#A1A1AA',
          primary: '#2563EB',
          secondary: '#7C3AED',
          accent: '#38BDF8',
        }
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "Segoe UI", "system-ui", "sans-serif"],
      }
    },
  },
  plugins: [],
}
