/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./contexts/**/*.{js,ts,jsx,tsx}",
    ],
    future: {
        hoverOnlyWhenSupported: true,
    },
    darkMode: 'class', // Enable class-based dark mode
    theme: {
        extend: {
            colors: {
                // Mirhal Mobile Colors
                brand: {
                    DEFAULT: '#4a3626', // Primary Brown
                    secondary: '#8b6f47', // Light Brown
                    accent: 'var(--brand-orange)', // Alias to Orange
                    orange: 'var(--brand-orange)', // Darker shiny orange
                    cream: '#ffffff', // Pure white
                    surface: '#ffffff', // Pure white surface
                    light: '#fafaf9',
                    dark: '#1c1917',
                },
                stone: {
                    50: '#fafaf9',
                    100: '#f5f5f4',
                    200: '#e7e5e4',
                    300: '#d6d3d1',
                    400: '#a8a29e',
                    500: '#78716c',
                    600: '#57534e',
                    700: '#44403c',
                    800: '#292524',
                    900: '#1c1917',
                    950: '#0c0a09',
                },
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                serif: ['"Playfair Display"', 'serif'],
                outfit: ['"Outfit"', 'sans-serif'],
                urbanist: ['"Urbanist"', 'sans-serif'],
                arabic: ['Arabic-Custom', 'sans-serif'],
            },
            boxShadow: {
                'luxury-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                'depth-sm': '0 4px 12px rgba(28, 25, 23, 0.08)',
                'depth-md': '0 12px 32px rgba(28, 25, 23, 0.12)',
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
                '6xl': '3rem',
                '7xl': '3.5rem',
            },
            animation: {
                'fade-in': 'fadeIn 0.8s ease-out',
                'slide-up': 'slideUp 0.8s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(40px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}
