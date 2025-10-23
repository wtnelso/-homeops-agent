/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Brand colors
        brand: {
          50: '#ecf3ff',
          100: '#dde9ff',
          200: '#c2d6ff',
          300: '#9cb9ff',
          400: '#7592ff',
          500: '#465fff',
          600: '#3641f5',
        },
        // Gray colors
        gray: {
          25: '#fcfcfd',
          50: '#f9fafb',
          100: '#f2f4f7',
          200: '#e4e7ec',
          300: '#d0d5dd',
          400: '#98a2b3',
          500: '#667085',
          600: '#475467',
          700: '#344054',
          800: '#1d2939',
          900: '#101828',
          950: '#0c111d',
        },
        // Success/error colors
        success: {
          50: '#ecfdf3',
          100: '#d1fadf',
          500: '#12b76a',
        },
        error: {
          50: '#fef3f2',
          100: '#fee4e2',
          500: '#f04438',
        },
        orange: {
          50: '#fff6ed',
          500: '#fb6514',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      fontSize: {
        'title-sm': ['30px', '38px'],
        'theme-xl': ['20px', '30px'],
        'theme-sm': ['14px', '20px'],
        'theme-xs': ['12px', '18px'],
      }
    },
  },
  plugins: [],
}