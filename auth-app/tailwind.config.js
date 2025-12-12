/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'media', // or 'class' for manual toggle
    theme: {
        extend: {
            colors: {
                // Primary Colors
                'goldenrod': '#D4A548',
                'cream': '#F5EDD8',
                'dark-brown': '#3D3028',
                'mint': '#4DB8A3',
                // Background
                'warm-white': '#FDFBF7',
            },
        },
    },
    plugins: [],
}
