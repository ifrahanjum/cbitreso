module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#000000',
          hover: '#050505',
          container: '#0A0A0A',
        },
        accent: {
          DEFAULT: '#FFFFFF',
          glow: 'rgba(255, 255, 255, 0.4)',
        },
        mauve: '#666666',
        cream: '#F4F2EE',
        background: '#000000',
        surface: {
          DEFAULT: '#050505',
          low: '#0A0A0A',
          lowest: '#111111',
          high: '#1A1A1A',
          highest: '#222222',
        },
        text: {
          primary: '#F4F2EE',
          secondary: '#A1A1AA',
        }
      },
      fontFamily: {
        heading: ['Inter', 'sans-serif'],
        label: ['Montserrat', 'sans-serif'],
        data: ['Outfit', 'sans-serif'],
        id: ['Oxanium', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
        zendots: ['"Zen Dots"', 'cursive'],
      },
      borderRadius: {
        '3xl': '2rem',
        '4xl': '3rem',
      },
      boxShadow: {
        'luxury': '0 40px 80px -20px rgba(0, 0, 0, 0.9)',
        'neural': '0 0 20px rgba(255, 255, 255, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.05)',
      }
    },
  },
  plugins: [],
}
