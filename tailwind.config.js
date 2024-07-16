/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,tsx}"],
  theme: {
    extend: {
      keyframes: {
        blink: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '10%, 90%': { backgroundColor: 'green' },
          '20%, 80%': { backgroundColor: 'blue' },
          '30%, 70%': { backgroundColor: 'yellow' },
          '40%, 60%': { backgroundColor: 'purple' },
          '50%': { backgroundColor: 'red' },
        },
      },
      animation: {
        blink: 'blink 1s infinite',
      },
    },
  },
  plugins: [],
};
