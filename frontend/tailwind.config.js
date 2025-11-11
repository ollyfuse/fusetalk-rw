/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'kigali-blue': '#0E6EB8',
        'sunset-orange': '#FF7A3D',
        'night-charcoal': '#111827',
        'soft-grey': '#F3F4F6',
        'success-green': '#10B981',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'montserrat': ['Montserrat', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
