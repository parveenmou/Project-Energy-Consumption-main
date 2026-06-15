/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#0D1117',
        card:    '#161B22',
        surface: '#21262D',
        edge:    '#30363D',
        accent:  '#58A6FF',
        coral:   '#F78166',
        muted:   '#8B949E',
        gold:    '#E3B341',
      },
    },
  },
  plugins: [],
}
