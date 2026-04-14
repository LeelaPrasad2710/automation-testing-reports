/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50:'#E6F1FB', 400:'#378ADD', 600:'#185FA5', 800:'#0C447C' }
      }
    }
  },
  plugins: []
}
