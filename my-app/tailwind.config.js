import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            keyframes: {
                "bounce-slow": {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-8px)" },
                },
                "fade-in": {
                    "0%": { opacity: "0", transform: "translateY(12px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "glow-pulse": {
                    "0%, 100%": {
                        boxShadow:
                            "0 0 8px rgba(255,59,192,0.3), 0 0 16px rgba(255,59,192,0.1)",
                    },
                    "50%": {
                        boxShadow:
                            "0 0 20px rgba(255,59,192,0.6), 0 0 40px rgba(255,59,192,0.3)",
                    },
                },
                "shimmer": {
                    "0%": { transform: "translateX(-100%) skewX(-15deg)" },
                    "100%": { transform: "translateX(300%) skewX(-15deg)" },
                },
            },
            animation: {
                "bounce-slow": "bounce-slow 2s ease-in-out infinite",
                "fade-in": "fade-in 0.4s ease-out both",
                "glow-pulse": "glow-pulse 2s ease-in-out infinite",
                "shimmer": "shimmer 2.5s ease-in-out infinite",
            },
            colors: {
                'surface-container-lowest': '#0c0c1f',
                'primary-container': '#7000ff',
                primary: '#d1bcff',
                'surface-container-highest': '#333348',
                'on-secondary': '#610046',
                'on-secondary-container': '#55003d',
                'on-background': '#e2e0fc',
                'surface-tint': '#d1bcff',
                'inverse-surface': '#e2e0fc',
                'outline-variant': '#4a4457',
                surface: '#0c0c1f',
                outline: '#958da3',
                'surface-container-low': '#1a1a2e',
                'tertiary-container': '#8e4a00',
                'tertiary-fixed-dim': '#ffb77f',
                'on-primary-fixed-variant': '#5700c9',
                'on-primary-fixed': '#23005b',
                background: '#0c0c1f',
                secondary: '#ffaed9',
                'tertiary-fixed': '#ffdcc4',
                'surface-bright': '#37374d',
                'secondary-container': '#ff3bc0',
                'error-container': '#93000a',
                'secondary-fixed-dim': '#ffaed9',
                'on-primary-container': '#ddcdff',
                'inverse-primary': '#7212ff',
                'on-tertiary-fixed-variant': '#6f3900',
                'on-surface-variant': '#ccc3da',
                tertiary: '#ffb77f',
                'surface-container': '#1e1e32',
                'on-surface': '#e2e0fc',
                'on-secondary-fixed': '#3c002a',
                'secondary-fixed': '#ffd8ea',
                'inverse-on-surface': '#2f2e43',
                'on-tertiary-container': '#ffcaa3',
                'primary-fixed': '#e9ddff',
                'surface-dim': '#0c0c1f',
                'primary-fixed-dim': '#d1bcff',
                'on-tertiary-fixed': '#2f1500',
                'surface-container-high': '#28283d',
                'on-tertiary': '#4e2600',
                'on-secondary-fixed-variant': '#890064',
                accent: '#a3e635',
                'accent-deep': '#3f6212',
                'accent-hover': '#bef264',
                'quest': '#38bdf8',
                'quest-deep': '#0284c7',
                'quest-hover': '#7dd3fc',
                'surface-variant': '#333348',
                error: '#ffb4ab',
                'on-error-container': '#ffdad6',
                'on-error': '#690005',
                'on-primary': '#3c0090',
            },
            borderRadius: {
                DEFAULT: '0.25rem',
                lg: '0.5rem',
                xl: '0.75rem',
                full: '9999px',
            },
            spacing: {
                'card-padding': '24px',
                gutter: '24px',
                margin: '32px',
                'button-depth': '6px',
                unit: '8px',
            },
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
                'headline-md': ['Lexend Variable', 'Lexend'],
                'headline-lg': ['Lexend Variable', 'Lexend'],
                'body-md': ['Plus Jakarta Sans Variable', 'Plus Jakarta Sans'],
                'body-lg': ['Plus Jakarta Sans Variable', 'Plus Jakarta Sans'],
                'headline-xl': ['Lexend Variable', 'Lexend'],
                'label-bold': ['Lexend Variable', 'Lexend'],
            },
        },
    },

    plugins: [forms],
};
