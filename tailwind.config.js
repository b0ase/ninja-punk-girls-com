/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#9c27b0',
          50: '#f3e5f5',
          100: '#e1bee7',
          200: '#ce93d8',
          300: '#ba68c8',
          400: '#ab47bc',
          500: '#9c27b0',
          600: '#8e24aa',
          700: '#7b1fa2',
          800: '#6a1b9a',
          900: '#4a148c',
        },
        secondary: {
          DEFAULT: '#ff3e9d',
          50: '#ffe1f1',
          100: '#ffb4dd',
          200: '#ff87c8',
          300: '#ff59b2',
          400: '#ff3e9d',
          500: '#ff2689',
          600: '#f50082',
          700: '#e00076',
          800: '#cc006b',
          900: '#b80061',
        },
      },
    },
  },
  plugins: [],
}; 