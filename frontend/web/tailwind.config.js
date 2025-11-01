/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Modern coral orange + white + black theme
        bg: "#0A0A0A",
        surface: "#1A1A1A",
        card: "#2A2A2A",
        primary: {
          50: "#FFF4F1",
          100: "#FFE6E0",
          200: "#FFD1C7",
          300: "#FFB4A3",
          400: "#FF7F5C",
          500: "#FF6B47", // Main coral orange
          600: "#F0571A",
          700: "#E03E1A",
          800: "#B83419",
          900: "#932F1B"
        },
        coral: "#FF6B47",
        white: "#FFFFFF",
        black: "#0A0A0A",
        gray: {
          50: "#F9F9F9",
          100: "#F0F0F0",
          200: "#E4E4E4",
          300: "#D1D1D1",
          400: "#B4B4B4",
          500: "#9B9B9B",
          600: "#6B6B6B",
          700: "#4A4A4A",
          800: "#2A2A2A",
          900: "#1A1A1A"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        'coral': '0 4px 14px 0 rgba(255, 107, 71, 0.2)',
        'coral-lg': '0 10px 40px 0 rgba(255, 107, 71, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'coral-pulse': 'coralPulse 2s infinite',
        'bounce-slow': 'bounce 3s infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        coralPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 107, 71, 0.7)' },
          '70%': { boxShadow: '0 0 0 10px rgba(255, 107, 71, 0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      }
    }
  },
  plugins: []
}
