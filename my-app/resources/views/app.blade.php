<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
    <!-- Tailwind CSS v3 CDN -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@700;800;900&amp;family=Plus+Jakarta+Sans:wght@500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "surface-container-lowest": "#0c0c1f",
                        "primary-container": "#7000ff",
                        "primary": "#d1bcff",
                        "surface-container-highest": "#333348",
                        "on-secondary": "#610046",
                        "on-secondary-container": "#55003d",
                        "on-background": "#e2e0fc",
                        "surface-tint": "#d1bcff",
                        "inverse-surface": "#e2e0fc",
                        "outline-variant": "#4a4457",
                        "surface": "#111125",
                        "outline": "#958da3",
                        "surface-container-low": "#1a1a2e",
                        "tertiary-container": "#8e4a00",
                        "tertiary-fixed-dim": "#ffb77f",
                        "on-primary-fixed-variant": "#5700c9",
                        "on-primary-fixed": "#23005b",
                        "background": "#111125",
                        "secondary": "#ffaed9",
                        "tertiary-fixed": "#ffdcc4",
                        "surface-bright": "#37374d",
                        "secondary-container": "#ff3bc0",
                        "error-container": "#93000a",
                        "secondary-fixed-dim": "#ffaed9",
                        "on-primary-container": "#ddcdff",
                        "inverse-primary": "#7212ff",
                        "on-tertiary-fixed-variant": "#6f3900",
                        "on-surface-variant": "#ccc3da",
                        "tertiary": "#ffb77f",
                        "surface-container": "#1e1e32",
                        "on-surface": "#e2e0fc",
                        "on-secondary-fixed": "#3c002a",
                        "secondary-fixed": "#ffd8ea",
                        "inverse-on-surface": "#2f2e43",
                        "on-tertiary-container": "#ffcaa3",
                        "primary-fixed": "#e9ddff",
                        "surface-dim": "#111125",
                        "primary-fixed-dim": "#d1bcff",
                        "on-tertiary-fixed": "#2f1500",
                        "surface-container-high": "#28283d",
                        "on-tertiary": "#4e2600",
                        "on-secondary-fixed-variant": "#890064",
                        "surface-variant": "#333348",
                        "error": "#ffb4ab",
                        "on-error-container": "#ffdad6",
                        "on-error": "#690005",
                        "on-primary": "#3c0090"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "card-padding": "24px",
                        "gutter": "24px",
                        "margin": "32px",
                        "button-depth": "6px",
                        "unit": "8px"
                    },
                    "fontFamily": {
                        "headline-md": ["Lexend"],
                        "headline-lg": ["Lexend"],
                        "body-md": ["Plus Jakarta Sans"],
                        "body-lg": ["Plus Jakarta Sans"],
                        "headline-xl": ["Lexend"],
                        "label-bold": ["Lexend"]
                    }
                },
            },
        }
    </script>
<style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        h1, h2, h3, button, label { font-family: 'Lexend', sans-serif; }
        .tactile-card {
            box-shadow: 8px 8px 0 0 #4c1d95;
        }
        .tactile-button {
            box-shadow: 0 6px 0 0 #4c1d95;
        }
        .tactile-button:active {
            box-shadow: 0 2px 0 0 #4c1d95;
            transform: translateY(4px);
        }
        .tactile-input {
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
        }
    </style>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
