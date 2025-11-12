/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#146C94',
          dark: '#0E4D68',
          light: '#1D8CB5'
        },
        accent: '#F97316',
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
        background: '#F1F5F9',
        surface: '#FFFFFF'
      }
    }
  },
  plugins: [forms]
}

