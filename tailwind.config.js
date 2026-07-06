/** @type {import('tailwindcss').Config} */
// Les couleurs pointent vers des variables CSS injectées par le thème actif
// (src/constants/theme.ts) — voir le wrapper dans app/_layout.tsx.
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;

module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: v('--c-bg'),
        surface: v('--c-surface'),
        card: v('--c-card'),
        cardAlt: v('--c-cardAlt'),
        line: v('--c-line'),
        ink: v('--c-ink'),
        mute: v('--c-mute'),
        brand: v('--c-brand'),
        brandDim: v('--c-brandDim'),
        sky: v('--c-sky'),
        skyDim: v('--c-skyDim'),
        warn: v('--c-warn'),
        danger: v('--c-danger'),
      },
      borderRadius: {
        '3xl': 28,
      },
    },
  },
  plugins: [],
};
