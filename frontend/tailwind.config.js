/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme derived from the user's reference UI image
        theme: {
          bg: '#121214',
          panel: '#19191d',
          card: '#212126',
          hover: '#2a2a32',
          border: '#2e2e36',
          borderLight: '#383844',
        },
        // Pastel Pill Highlights
        pastel: {
          peach: '#ea9d85',
          peachBg: '#252021',
          mint: '#86c8a7',
          mintBg: '#1d2622',
          purple: '#b09cec',
          purpleBg: '#22202a',
          blue: '#93b4ed',
          blueBg: '#1e222a',
          amber: '#e58c44',
        },
        accent: {
          coral: '#d96b43',
          coralHover: '#c75c36',
          coralDark: '#3b231c',
          coralLight: '#f4a589',
        },
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#d96b43', // Terracotta Warm Coral matching image
          600: '#c75c36',
          700: '#9a3e23',
          800: '#7c2d16',
          900: '#4a2c20',
          950: '#27120a',
        },
        success: {
          50: '#edfcf2',
          100: '#d3f8df',
          500: '#86c8a7',
          600: '#65b38d',
          700: '#469671',
        },
        danger: {
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#e58c44',
          600: '#d97706',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 25px -5px rgba(217, 107, 67, 0.25)',
        'glow-mint': '0 0 25px -5px rgba(134, 200, 167, 0.25)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
