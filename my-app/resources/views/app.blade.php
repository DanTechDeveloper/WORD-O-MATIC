<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>
        <meta name="description" content="WordOMatic — practice that feels like play for K-5 readers. Teachers track progress at a glance.">
        <meta property="og:title" content="Word-O-Matic — Learn Through Play">
        <meta property="og:description" content="Practice that feels like play for K-5 readers. Teachers see progress at a glance.">
        <meta property="og:image" content="{{ asset('og-image.png') }}">
        <meta property="og:type" content="website">
        <meta name="twitter:card" content="summary_large_image">
        <link rel="icon" href="{{ asset('favicon.ico') }}">
        <link rel="apple-touch-icon" href="{{ asset('apple-touch-icon.png') }}">
        <link rel="manifest" href="{{ asset('site.webmanifest') }}">

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
