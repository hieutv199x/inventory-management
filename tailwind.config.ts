import type { Config } from "tailwindcss";

const config: Config = {
  // ...existing code...
  theme: {
    extend: {
      // ...existing code...
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-roboto)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
        roboto: ['var(--font-roboto)', 'sans-serif'],
      },
      // ...existing code...
    },
  },
  // ...existing code...
};
export default config;