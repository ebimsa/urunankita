import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './app/**/*.{vue,js,ts,jsx,tsx}',
    './components/**/*.{vue,js,ts,jsx,tsx}',
    './layouts/**/*.{vue,js,ts,jsx,tsx}',
    './pages/**/*.{vue,js,ts,jsx,tsx}',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        brand: {
          tealDark: '#007979',
          teal: '#24B1B1',
          cream: '#FFE2AF',
          orange: '#E37434',
        },
        neu: {
          base: '#eaf0f7',
          surface: '#edf3fa',
          dark: '#1e293b',
          muted: '#64748b',
          light: '#f7faff',
        },
      },
      boxShadow: {
        // Classic Neumorphic flat (extruded)
        'neu-flat': '8px 8px 18px #cad5e2, -8px -8px 18px #ffffff',
        'neu-flat-sm': '4px 4px 10px #cbd7e4, -4px -4px 10px #ffffff',
        'neu-flat-lg': '14px 14px 28px #c5d2e2, -14px -14px 28px #ffffff',
        
        // Neumorphic pressed / inset (debossed)
        'neu-pressed': 'inset 4px 4px 8px #cad5e2, inset -4px -4px 8px #ffffff',
        'neu-pressed-sm': 'inset 2px 2px 5px #cad5e2, inset -2px -2px 5px #ffffff',
        
        // Brand-colored neumorphic glows & extrusions
        'neu-orange': '6px 6px 18px rgba(227, 116, 52, 0.38), -4px -4px 14px rgba(255, 255, 255, 0.9)',
        'neu-orange-pressed': 'inset 3px 3px 6px rgba(175, 75, 15, 0.4), inset -2px -2px 5px rgba(255, 200, 160, 0.3)',
        'neu-teal': '6px 6px 18px rgba(0, 121, 121, 0.38), -4px -4px 14px rgba(255, 255, 255, 0.9)',
        'neu-teal-light': '6px 6px 18px rgba(36, 177, 177, 0.35), -4px -4px 14px rgba(255, 255, 255, 0.9)',
        'neu-cream': '6px 6px 16px rgba(214, 183, 130, 0.45), -4px -4px 14px rgba(255, 255, 255, 0.9)',
      },
    },
  },
}
