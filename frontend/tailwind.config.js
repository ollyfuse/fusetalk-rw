/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Rwanda Color Palette
        'rwanda-green': '#009E60',
        'rwanda-yellow': '#FFD700',
        'tech-blue': '#0066FF',
        'kigali-blue': '#0E6EB8',
        'sunset-orange': '#FF7A3D',
        'night-charcoal': '#111827',
        'soft-grey': '#F3F4F6',
        'success-green': '#10B981',
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'montserrat': ['Montserrat', 'sans-serif'],
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(0, 158, 96, 0.4)' 
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(0, 158, 96, 0.8)' 
          },
        },
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
