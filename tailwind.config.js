/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary navy matching the app screenshots
        navy: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          500: '#3b4fd8',
          700: '#1e3a8a',
          800: '#1a2f75',
          900: '#0f1f5c',
        },
        // Soft sky-blue accent
        sky: {
          50:  '#f0f6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

