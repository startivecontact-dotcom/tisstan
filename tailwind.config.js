/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#0A0F0D',
        surface: '#101714',
        card: '#151E1A',
        line: '#233029',
        ink: '#F4F7F5',
        mute: '#8CA096',
        brand: '#34D399',
        brandDim: '#10B981',
        sky: '#38BDF8',
        skyDim: '#0EA5E9',
        warn: '#FBBF24',
        danger: '#F87171',
      },
      borderRadius: {
        '3xl': 28,
      },
    },
  },
  plugins: [],
};
